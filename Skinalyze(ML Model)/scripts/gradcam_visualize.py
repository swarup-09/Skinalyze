import os
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import cv2
from tensorflow.keras.preprocessing import image

# Load model
model_path = r"D:\skin_disease_project\models\skin_disease_model_mobilenetv2.h5"
model = tf.keras.models.load_model(model_path)


base_model = model.layers[0]  # MobileNetV2
head_model = tf.keras.Sequential(model.layers[1:])  # Remaining layers


train_dir = r"D:\skin_disease_project\dataset_split\train"
class_names = sorted([f for f in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, f))])


img_path = r"D:\skin_disease_project\dataset_split\test\Melanoma\ISIC_0036019.JPG"
img = image.load_img(img_path, target_size=(224, 224))
img_array = image.img_to_array(img) / 255.0
img_array = np.expand_dims(img_array, axis=0)

pred = model.predict(img_array)
predicted_class_index = np.argmax(pred)
predicted_class = class_names[predicted_class_index]
print(f" Predicted Disease: {predicted_class}")


last_conv_layer = base_model.get_layer('Conv_1')  # Last conv layer

grad_model = tf.keras.models.Model(
    inputs=base_model.input,
    outputs=[last_conv_layer.output, base_model.output]
)

with tf.GradientTape() as tape:
    conv_outputs, predictions = grad_model(img_array)
    predictions = head_model(predictions)
    loss = predictions[:, predicted_class_index]

grads = tape.gradient(loss, conv_outputs)
pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
conv_outputs = conv_outputs[0] * pooled_grads

heatmap = np.mean(conv_outputs, axis=-1)
heatmap = np.maximum(heatmap, 0)
heatmap /= np.max(heatmap)


heatmap_resized = cv2.resize(heatmap, (224, 224))
heatmap_color = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)

orig_img = cv2.imread(img_path)
orig_img = cv2.resize(orig_img, (224, 224))
overlay = cv2.addWeighted(orig_img, 0.6, heatmap_color, 0.4, 0)


plt.imshow(cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB))
plt.axis('off')
plt.title(f'Grad-CAM Severity Highlight: {predicted_class}')
plt.show()


