import os
import json
import numpy as np
import tensorflow as tf
import cv2
import base64
from tensorflow.keras.utils import load_img, img_to_array
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List
from io import BytesIO

# --- PATHS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "skin_disease_model_mobilenetv2.h5")
TRAIN_DIR = os.path.join(BASE_DIR, "dataset_split", "train")
DISEASE_INFO_PATH = os.path.join(BASE_DIR, "scripts", "disease_info.json")

IMAGE_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.50
LAST_CONV_LAYER_NAME = "Conv_1"

# Global Variables
model = None
GRAD_MODEL = None
CLASS_NAMES = []
DISEASE_INFO = {}

# --- STARTUP BLOCK ---
try:
    print("🔄 Initializing API...")

    # 1. Load the "Sequential" container
    with tf.keras.utils.custom_object_scope({"BatchNormalization": tf.keras.layers.BatchNormalization}):
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)

    # 2. Identify the parts
    rescaling_layer = model.layers[0]   # Rescaling
    base_mobilenet = model.layers[1]    # MobileNetV2
    head_layers = model.layers[2:]      # Pooling, Dropout, Dense...

    # 3. Create a clean "Extractor" for the MobileNet part
    # This pulls the 'Conv_1' and the final output from the base model
    mobilenet_extractor = tf.keras.Model(
        inputs=base_mobilenet.input,
        outputs=[
            base_mobilenet.get_layer(LAST_CONV_LAYER_NAME).output, 
            base_mobilenet.output
        ]
    )

    # 4. REBUILD THE GRAPH for Grad-CAM
    # We create a NEW input tensor and pass it through the chain manually.
    # This guarantees a valid, connected graph.
    
    grad_input = tf.keras.Input(shape=(224, 224, 3), name="grad_cam_input")
    
    x = rescaling_layer(grad_input)                 # Step 1: Rescale
    conv_features, base_features = mobilenet_extractor(x) # Step 2: Get features
    
    # Step 3: Pass through the head layers
    preds = base_features
    for layer in head_layers:
        preds = layer(preds)

    # 5. Assemble the final Grad-CAM model
    GRAD_MODEL = tf.keras.Model(
        inputs=grad_input,
        outputs=[conv_features, preds]
    )

    # 6. Warm up
    dummy = tf.zeros((1, 224, 224, 3))
    GRAD_MODEL(dummy)
    # Also warm up the main model for the simple predict endpoint
    model(dummy) 
    
    print("✅ Grad-CAM Graph Rebuilt & Warmed Up!")

    # 7. Load Data
    if os.path.exists(TRAIN_DIR):
        CLASS_NAMES = sorted([f for f in os.listdir(TRAIN_DIR) if os.path.isdir(os.path.join(TRAIN_DIR, f))])
    
    if os.path.exists(DISEASE_INFO_PATH):
        with open(DISEASE_INFO_PATH, "r") as f:
            DISEASE_INFO = json.load(f)

except Exception as e:
    print(f"❌ Startup Error: {e}")
    raise RuntimeError(f"Startup Failed: {e}")

# --- API ---
app = FastAPI(title="Skin Disease API", version="1.5.0")

class DiseaseResponse(BaseModel):
    success: bool
    predicted_disease: str
    confidence: float
    cause: str
    precautions: List[str]
    grad_cam_image_base64: str

# --- FUNCTIONS ---
def load_and_preprocess_image(file_content: bytes) -> tuple[np.ndarray, np.ndarray]:
    try:
        img = load_img(BytesIO(file_content), target_size=IMAGE_SIZE)
        img_array = img_to_array(img)
        img_array_expanded = np.expand_dims(img_array, axis=0)

        np_arr = np.frombuffer(file_content, np.uint8)
        orig_img_cv = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        orig_img_cv_resized = cv2.resize(orig_img_cv, IMAGE_SIZE)
        return img_array_expanded, orig_img_cv_resized
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image Error: {e}")

def generate_grad_cam_overlay_base64(img_array: np.ndarray, orig_img_cv: np.ndarray, predicted_class_index: int) -> str:
    try:
        # Convert to Tensor for Keras 3
        img_tensor = tf.convert_to_tensor(img_array, dtype=tf.float32)

        with tf.GradientTape() as tape:
            # Use the REBUILT GRAD_MODEL
            conv_outputs, predictions = GRAD_MODEL(img_tensor)
            loss = predictions[:, predicted_class_index]

        grads = tape.gradient(loss, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        
        conv_outputs = conv_outputs[0]
        heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)

        heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
        heatmap = heatmap.numpy()
 
        heatmap_resized = cv2.resize(heatmap, IMAGE_SIZE)
        heatmap_color = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(orig_img_cv, 0.6, heatmap_color, 0.4, 0)

        _, buffer = cv2.imencode('.png', overlay)
        return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        print(f"Grad-CAM Error: {e}")
        return ""

@app.post("/predict", response_model=DiseaseResponse)
async def predict_disease(image: UploadFile = File(...)):
    file_content = await image.read()
    img_array, orig_img_cv = load_and_preprocess_image(file_content)

    # Use standard model for prediction
    pred = model.predict(img_array, verbose=0)[0] 
    predicted_class_index = np.argmax(pred)
    confidence = float(pred[predicted_class_index])

    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "success": False, 
            "predicted_disease": " No significant disease found", 
            "confidence": round(confidence * 100, 2), 
            "cause": "N/A", "precautions": [], "grad_cam_image_base64": ""
        }

    predicted_disease = CLASS_NAMES[predicted_class_index]
    base64_image = generate_grad_cam_overlay_base64(img_array, orig_img_cv, predicted_class_index)
    info = DISEASE_INFO.get(predicted_disease, {"cause": "Unknown", "precautions": []})

    return {
        "success": True,
        "predicted_disease": predicted_disease,
        "confidence": round(confidence * 100, 2),
        "cause": info["cause"],
        "precautions": info["precautions"],
        "grad_cam_image_base64": base64_image
    }

@app.get("/")
def health_check():
    return {"status": "ok"}

#uvicorn gradcam_API:app --host 0.0.0.0 --port 5000