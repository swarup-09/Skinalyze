# 🔬 Skinalyze — AI-Powered Skin Disease Detection

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.79.6-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-53.0-000020?style=for-the-badge&logo=expo&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.20-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)

**A full-stack, cross-platform mobile application for AI-assisted skin disease detection with Grad-CAM explainability heatmaps.**

</div>

---

## ✨ Overview

**Skinalyze** combines a fine-tuned **MobileNetV2** deep learning model with a high-performance **FastAPI** inference gateway and a polished **React Native (Expo)** mobile client to deliver real-time skin disease analysis — with visual explainability built in.

Users can snap or upload a photo of a skin lesion and receive:
- A **predicted diagnosis** across 15 disease classes
- A **confidence score** for the prediction
- A **Grad-CAM heatmap overlay** visually highlighting what the AI focused on
- Clinical **cause and precaution** information
- A **printable PDF medical report**

> **⚠️ Disclaimer:** Skinalyze is an AI-assisted screening tool. All results are for informational purposes only and do **not** constitute a medical diagnosis. Always consult a certified dermatologist.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native Client (Expo)                  │
│  Camera / Gallery  ──►  Image Compress (quality: 0.8)          │
│  FormData Upload   ──►  POST /predict  ──►  JSON + base64 img  │
│  Canvas Overlay    ◄──  Grad-CAM Heatmap  ◄──  FastAPI         │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP (multipart/form-data)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Inference Gateway                      │
│  Binary Stream Handler  ──►  Preprocess (224×224)               │
│  MobileNetV2 Inference  ──►  Softmax Predictions                │
│  GradientTape (TF)      ──►  Conv_1 Layer Gradients             │
│  Heatmap Overlay (CV2)  ──►  Base64 PNG Response                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│        MobileNetV2 + Custom Head  (Keras 3 / TF 2.20)          │
│  Rescaling → MobileNetV2 → GAP → Dropout → Dense → Softmax     │
│  15 skin disease classes  |  Input: 224×224×3                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features

| Feature | Details |
|---|---|
| 🧠 **AI Inference** | Fine-tuned MobileNetV2 on ISIC dataset, 15 disease classes |
| 🔥 **Grad-CAM XAI** | Gradient-based heatmap overlays via `GradientTape` on `Conv_1` |
| ⚡ **Low Latency** | < 350ms end-to-end response time |
| 📦 **Payload Compression** | Camera images compressed at `quality: 0.8` — ~60% smaller uploads |
| 📱 **Cross-Platform** | iOS & Android via Expo — single codebase |
| 🖨️ **PDF Reports** | Printable medical report with patient profile, scan images, and precautions |
| 👤 **User Profiles** | Auth + user data via Appwrite (multi-profile skin health tracking) |
| 🩺 **Doctor Directory** | `doc` tab for finding nearby dermatologists |
| 📈 **Health Trends** | SVG-based skin score history chart per profile |

---

## 🦠 Supported Disease Classes

The model classifies images across **15 skin conditions**:

| # | Class | # | Class |
|---|---|---|---|
| 1 | Actinic Keratosis | 9 | Nevus |
| 2 | Basal Cell Carcinoma | 10 | Pigmented Benign Keratosis |
| 3 | Dermatitis | 11 | Seborrheic Keratosis |
| 4 | Dermatofibroma | 12 | Squamous Cell Carcinoma |
| 5 | Fungal Infections | 13 | Vascular Lesion |
| 6 | Healthy | 14 | Demodicosis |
| 7 | Hypersensitivity | 15 | Ringworm |
| 8 | Melanoma | | |

---

## 📁 Project Structure

```
Skinalyze/
├── skin_disease_project/          # 🐍 Python Backend
│   ├── scripts/
│   │   ├── gradcam_API.py         # FastAPI server with Grad-CAM inference endpoint
│   │   ├── train_model.py         # MobileNetV2 training script
│   │   ├── split_dataset.py       # Train/Val/Test dataset splitter
│   │   └── disease_info.json      # Clinical cause & precaution data per disease
│   ├── models/
│   │   ├── skin_disease_model_mobilenetv2.h5   # Trained model weights
│   │   └── class_names.json                    # Ordered class label list
│   ├── dataset_split/             # ISIC dataset (train / val / test splits)
│   └── requirements.txt           # Python dependencies
│
└── Skinalyze-frontend/            # 📱 React Native Client (Expo)
    ├── app/
    │   ├── (tabs)/
    │   │   ├── index.tsx          # Scan screen (camera / gallery + upload)
    │   │   ├── home.tsx           # Dashboard (skin score, health trend, profiles)
    │   │   ├── doc.tsx            # Doctor directory
    │   │   └── profile.tsx        # User profile screen
    │   ├── result.tsx             # Results screen (heatmap overlay, PDF export)
    │   └── auth.tsx               # Authentication screen
    ├── lib/
    │   ├── appwrite.ts            # Appwrite client config
    │   └── auth-context.tsx       # Auth state management (React Context)
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Python **3.10+**
- Node.js **18+** and npm / yarn
- Expo CLI (`npm install -g expo-cli`)
- An [Appwrite](https://appwrite.io) project (for auth & user profiles)

---

### 🐍 Backend — FastAPI Server

**1. Create and activate a virtual environment:**
```bash
cd skin_disease_project
python -m venv venv
source venv/bin/activate        # Linux / macOS
venv\Scripts\activate           # Windows
```

**2. Install dependencies:**
```bash
pip install -r requirements.txt
```

**3. Ensure the model file is in place:**
```
skin_disease_project/models/skin_disease_model_mobilenetv2.h5
```

**4. Start the API server:**
```bash
uvicorn scripts.gradcam_API:app --host 0.0.0.0 --port 5000 --reload
```

The server will be available at `http://0.0.0.0:5000`.

> **Health Check:** `GET /` → `{ "status": "ok" }`
>
> **Predict Endpoint:** `POST /predict` — accepts a `multipart/form-data` image upload.

---

### 📱 Frontend — React Native (Expo)

**1. Install dependencies:**
```bash
cd Skinalyze-frontend
npm install
```

**2. Configure environment variables:**

Create a `.env` file in `Skinalyze-frontend/` with your Appwrite credentials:
```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_PLATFORM=com.yourcompany.skinalyze
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your_users_collection_id
EXPO_PUBLIC_APPWRITE_DERMATOLOGISTS_COLLECTION_ID=your_dermatologists_collection_id
```

**3. Update the API base URL:**

In [`app/(tabs)/index.tsx`](./Skinalyze-frontend/app/(tabs)/index.tsx), update the API URL to your machine's local IP:
```ts
const API_BASE_URL = 'http://<YOUR_LOCAL_IP>:5000';
```

**4. Start the Expo development server:**
```bash
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) or press `a` / `i` for emulators.

---

### 🧠 Training Your Own Model (Optional)

```bash
cd skin_disease_project
python scripts/train_model.py
```

Configure paths in `train_model.py` to point to your local `dataset_split/` directory. The script uses:
- **MobileNetV2** (ImageNet pretrained, frozen base)
- **GlobalAveragePooling → Dropout(0.3) → Dense(128) → Dropout(0.2) → Softmax**
- **Adam** optimizer (lr=0.0001), `categorical_crossentropy` loss
- Input size: 224×224, Batch size: 32

---

## 🔌 API Reference

### `POST /predict`

Accepts a skin image and returns inference results with Grad-CAM.

**Request:**
```
Content-Type: multipart/form-data
Body: image (file) — JPEG or PNG
```

**Response (JSON):**
```json
{
  "success": true,
  "predicted_disease": "Melanoma",
  "confidence": 94.27,
  "cause": "Malignant transformation of melanocytes driven by UV radiation exposure...",
  "precautions": [
    "Strict avoidance of intentional sun exposure.",
    "Daily broad-spectrum sunscreen (SPF 30+).",
    "Monthly self-examinations (ABCDE rule).",
    "Annual comprehensive skin examinations with a dermatologist."
  ],
  "grad_cam_image_base64": "<base64-encoded PNG string>"
}
```

**Low Confidence Response (`confidence < 50%`):**
```json
{
  "success": false,
  "predicted_disease": "No significant disease found",
  "confidence": 38.5,
  "cause": "N/A",
  "precautions": [],
  "grad_cam_image_base64": ""
}
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Role |
|---|---|
| **FastAPI** | Async REST API gateway |
| **TensorFlow 2.20 / Keras 3** | Model inference + Grad-CAM via `GradientTape` |
| **OpenCV** | Heatmap colorization & overlay composition |
| **Uvicorn** | ASGI server |
| **Pydantic v2** | Request/response schema validation |

### Frontend
| Technology | Role |
|---|---|
| **React Native 0.79** | Cross-platform mobile framework |
| **Expo SDK 53** | Managed workflow + native modules |
| **Expo Router** | File-based navigation |
| **expo-image-picker** | Camera capture & gallery access |
| **expo-print** | PDF report generation |
| **Appwrite** | Auth, database & user profile backend |
| **react-native-paper** | Material Design UI components |
| **react-native-svg** | SVG health trend chart |
| **TypeScript** | Type safety across the entire frontend |

---

## 📊 How Grad-CAM Works

Grad-CAM (**Gradient-weighted Class Activation Mapping**) produces a visual explanation of the model's decision:

1. A rebuilt gradient model outputs both the **`Conv_1` feature maps** and the **final predictions** simultaneously.
2. `tf.GradientTape` records gradients of the predicted class score with respect to `Conv_1` activations.
3. Gradients are **global-average-pooled** to produce per-channel weights.
4. A weighted sum of the feature maps produces a raw heatmap, ReLU-clamped and normalized.
5. The heatmap is **resized to 224×224**, colorized with `cv2.COLORMAP_JET`, and alpha-blended (60/40) with the original image.
6. The overlay is **base64-encoded as PNG** and returned inline in the JSON response — no file I/O required.


## 📄 License

This project is for educational and research purposes. The ISIC dataset is subject to its own [terms of use](https://www.isic-archive.com/). Not intended for clinical deployment without proper regulatory review.
