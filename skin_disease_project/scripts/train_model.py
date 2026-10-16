import os
import tensorflow as tf
import matplotlib.pyplot as plt
import numpy as np
# MODERN IMPORTS for TF 2.20+
from tensorflow.keras.utils import image_dataset_from_directory
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout, Rescaling
from tensorflow.keras.optimizers import Adam

# --- PATHS ---
base_dir = r"D:\KIT\Projects\skin_disease_project\dataset_split"
train_dir = os.path.join(base_dir, "train")
val_dir = os.path.join(base_dir, "val")
test_dir = os.path.join(base_dir, "test")

img_size = 224
batch_size = 32
epochs = 10
num_classes = len(os.listdir(train_dir))

# --- MODERN DATA LOADING (Replacement for ImageDataGenerator) ---
# ImageDataGenerator is deprecated. image_dataset_from_directory is faster and better for TF 2.20
train_data = image_dataset_from_directory(train_dir, image_size=(img_size, img_size), batch_size=batch_size, label_mode='categorical')
val_data = image_dataset_from_directory(val_dir, image_size=(img_size, img_size), batch_size=batch_size, label_mode='categorical')
test_data = image_dataset_from_directory(test_dir, image_size=(img_size, img_size), batch_size=batch_size, label_mode='categorical')

# --- MODEL BUILDING ---
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(img_size, img_size, 3))
base_model.trainable = False

model = Sequential([
    Rescaling(1./255), # Scaling inside the model makes the API much easier to use!
    base_model,
    GlobalAveragePooling2D(),
    Dropout(0.3),
    Dense(128, activation='relu'),
    Dropout(0.2),
    Dense(num_classes, activation='softmax')
])

model.compile(optimizer=Adam(0.0001), loss='categorical_crossentropy', metrics=['accuracy'])

# --- TRAINING ---
history = model.fit(train_data, validation_data=val_data, epochs=epochs)

# --- SAVING (The Fix) ---
save_path = r"D:\KIT\Projects\skin_disease_project\models"
os.makedirs(save_path, exist_ok=True)

# Save as .keras instead of .h5 if possible (Native Keras 3 format)
# If you must use .h5, Keras 3 will now save it with the correct 'axis=3' format
model.save(os.path.join(save_path, "skin_disease_model_mobilenetv2.h5"))
print(f"✅ Model saved to {save_path}")