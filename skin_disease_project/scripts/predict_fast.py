from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.preprocessing import image
import tensorflow as tf
import numpy as np
import os
import json
import io

# ── 1. App & CORS ────────────────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 2. Configuration ─────────────────────────────────────────────────────────
MODEL_PATH = r"D:\KIT\Projects\skin_disease_project\models\skin_disease_model_mobilenetv2.h5"
DATASET_TRAIN_DIR = r"D:\KIT\Projects\skin_disease_project\dataset_split\train"
DISEASE_INFO_PATH = r"D:\KIT\Projects\skin_disease_project\scripts\disease_info.json"
IMG_SIZE = (224, 224)

# ── 3. Load model and class names ────────────────────────────────────────────
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ Model loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    model = None

try:
    class_names = sorted(os.listdir(DATASET_TRAIN_DIR))
    print("✅ Class names loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load class names: {e}")
    class_names = []

# ── 4. Load disease info ─────────────────────────────────────────────────────
try:
    with open(DISEASE_INFO_PATH, "r") as f:
        disease_info = json.load(f)
    print("✅ Disease info loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load disease_info.json: {e}")
    disease_info = {}

# ── 5. Helper function: preprocess uploaded image ────────────────────────────
def preprocess(file_bytes):
    try:
        img = image.load_img(io.BytesIO(file_bytes), target_size=IMG_SIZE)
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {e}")
@app.get("/")
def root():
    return {"Success"}

# ── 6. Prediction endpoint ───────────────────────────────────────────────────
@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    if not model or not class_names:
        raise HTTPException(status_code=500, detail="Model or class names not loaded.")

    try:
        # Read file bytes
        file_bytes = await image.read()

        # Preprocess
        img_batch = preprocess(file_bytes)

        # Predict
        predictions = model.predict(img_batch)[0]
        predicted_idx = int(np.argmax(predictions))
        predicted_disease = class_names[predicted_idx]
        confidence = float(predictions[predicted_idx])

        # Get disease info
        info = disease_info.get(predicted_disease, {})

        return {
            "success": True,
            "predicted_disease": predicted_disease,
            "confidence": round(confidence * 100, 2),
            "cause": info.get("cause", "Information not available."),
            "precautions": info.get("precautions", [])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── 7. Run with Uvicorn ──────────────────────────────────────────────────────
# Run using: uvicorn filename:app --host 0.0.0.0 --port 5000 --reload
