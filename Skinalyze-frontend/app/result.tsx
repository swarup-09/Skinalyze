import React from 'react';
import { View, ScrollView, StyleSheet, Image, Dimensions, ActivityIndicator, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Text, Button, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Make sure this path is correct based on your project structure
import { useAuth } from "@/lib/auth-context";

type ResultType = {
  cause: string;
  confidence: number;
  precautions: string[];
  predicted_disease: string;
  success: boolean;
  grad_cam_image_base64: string;
};

export default function ResultScreen() {
  const router = useRouter();
  const { data, imageUri } = useLocalSearchParams<{ data: string; imageUri: string }>();

  // Safe parsing to prevent crashes if data is missing
  let parsed: ResultType | null = null;
  try {
    parsed = data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Error parsing result data:", e);
  }

  const { user, userData, isLoadingUserData } = useAuth();

  const screenWidth = Dimensions.get('window').width;

  // --- 1. DATA PREPARATION ---
  const currentDate = new Date().toLocaleDateString();
  const patientName = userData?.fullName || user?.name || "Guest Patient";
  const patientDOB = userData?.dob || "N/A";
  const patientGender = userData?.gender || "N/A";
  const patientContact = userData?.phone || user?.email || "N/A";

  const gradCamUri = parsed?.grad_cam_image_base64
    ? `data:image/png;base64,${parsed.grad_cam_image_base64}`
    : null;

  const calculateAge = (dobString: string) => {
    if (!dobString || dobString === "N/A") return 'N/A';
    try {
      const birthDate = new Date(dobString);
      if (isNaN(birthDate.getTime())) return 'N/A'; // Invalid date check
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age}`;
    } catch (e) {
      return 'N/A';
    }
  };

  const patientAgeDisplay = calculateAge(patientDOB);

  // --- 2. PDF GENERATION ---
  const handlePrint = async () => {
    if (!parsed) return;

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; margin: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2a9d8f; padding-bottom: 10px; margin-bottom: 20px; }
            .brand { font-size: 28px; font-weight: bold; color: #2a9d8f; }
            .report-date { text-align: right; font-size: 14px; color: #666; }
            
            .grid-container { display: flex; gap: 20px; margin-bottom: 20px; }
            .info-box { flex: 1; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
            .info-title { font-size: 14px; color: #2a9d8f; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
            .info-text { font-size: 16px; margin-bottom: 4px; }
            
            .diagnosis-box { background: #e8f5e9; border: 1px solid #c8e6c9; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
            .disease-name { font-size: 24px; font-weight: bold; color: #d32f2f; }
            .confidence { font-size: 14px; color: #555; }
            
            .images-row { display: flex; justify-content: center; gap: 20px; margin: 20px 0; }
            .img-wrapper { text-align: center; width: 45%; }
            .scan-img { width: 100%; border-radius: 8px; border: 1px solid #ccc; max-height: 250px; object-fit: cover; }
            
            .section { margin-bottom: 20px; }
            .section-header { font-size: 18px; font-weight: bold; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
            ul { margin-top: 5px; padding-left: 20px; }
            li { margin-bottom: 5px; }
            
            .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">Skinalyze AI</div>
            <div class="report-date">
              Report Date: ${currentDate}<br>
              Report ID: #${Math.floor(Math.random() * 100000)}
            </div>
          </div>

          <div class="grid-container">
            <div class="info-box">
              <div class="info-title">Patient Details</div>
              <div class="info-text"><strong>Name:</strong> ${patientName}</div>
              <div class="info-text"><strong>Age/Sex:</strong> ${patientAgeDisplay} / ${patientGender}</div>
              <div class="info-text"><strong>Contact:</strong> ${patientContact}</div>
            </div>
            <div class="info-box">
              <div class="info-title">Consulting Clinic</div>
              <div class="info-text"><strong>Skinalyze Digital Clinic</strong></div>
              <div class="info-text">Dr. AI Assistant (Prelim)</div>
              <div class="info-text">Ref: Dermatologist Review Req.</div>
            </div>
          </div>

          <div class="diagnosis-box">
            <div class="info-title">AI Analysis Result</div>
            <div class="disease-name">${parsed.predicted_disease}</div>
            <div class="confidence">Confidence Score: ${parsed.confidence.toFixed(2)}%</div>
          </div>

          <div class="images-row">
            <div class="img-wrapper">
              <img src="${imageUri}" class="scan-img" />
              <p>Original Scan</p>
            </div>
            ${gradCamUri ? `
            <div class="img-wrapper">
              <img src="${gradCamUri}" class="scan-img" />
              <p>Heatmap Analysis</p>
            </div>` : ''}
          </div>

          <div class="section">
            <div class="section-header">Potential Cause</div>
            <p>${parsed.cause}</p>
          </div>

          <div class="section">
            <div class="section-header">Recommended Precautions</div>
            <ul>
              ${parsed.precautions.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>

          <div class="footer">
            <strong>DISCLAIMER:</strong> This report is generated by an Artificial Intelligence model and is for informational purposes only. 
            It is NOT a medical diagnosis. Please consult a certified dermatologist for professional medical advice.
          </div>
        </body>
      </html>
    `;

    try {
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      Alert.alert("Print Error", "Could not generate PDF.");
    }
  };

  // --- 3. LOADING STATE ---
  if (isLoadingUserData || !parsed) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2a9d8f" />
        <Text style={{ marginTop: 10 }}>Processing Results...</Text>
      </View>
    );
  }

  // --- 4. RENDER ---
  return (
    <LinearGradient
      colors={['#e0f7fa', '#f0f4f8']} // Softer, more medical-looking gradient
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerContainer}>
          <MaterialCommunityIcons name="shield-check" size={40} color="#2a9d8f" />
          <Text variant="headlineSmall" style={styles.successHeader}>Analysis Complete</Text>
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>

        {/* --- IMAGE COMPARISON CARD --- */}
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Visual Analysis</Text>
            <View style={styles.imageRow}>
              <View style={styles.imageWrapper}>
                <Text style={styles.imageLabel}>Original</Text>
                <Image source={{ uri: imageUri }} style={styles.imageStyle} />
              </View>
              <View style={styles.imageWrapper}>
                <Text style={styles.imageLabel}>Heatmap</Text>
                {gradCamUri ? (
                  <Image source={{ uri: gradCamUri }} style={styles.imageStyle} />
                ) : (
                  <View style={[styles.imageStyle, styles.placeholder]}>
                    <ActivityIndicator color="#2a9d8f" />
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.captionText}>
              *The heatmap highlights areas the AI used to make the prediction.
            </Text>
          </Card.Content>
        </Card>

        {/* --- RESULT DETAILS CARD --- */}
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <View style={styles.resultHeader}>
              <Text variant="labelLarge" style={{ color: '#888' }}>PREDICTED CONDITION</Text>
              <Text variant="headlineMedium" style={styles.diseaseTitle}>{parsed.predicted_disease}</Text>
              <View style={[styles.badge, { backgroundColor: parsed.confidence > 80 ? '#e8f5e9' : '#fff3e0' }]}>
                <Text style={{ color: parsed.confidence > 80 ? '#2e7d32' : '#e65100', fontWeight: 'bold' }}>
                  {parsed.confidence.toFixed(1)}% Confidence
                </Text>
              </View>
            </View>

            <Divider style={{ marginVertical: 15 }} />

            <Text variant="titleMedium" style={styles.sectionHeader}>Possible Cause</Text>
            <Text style={styles.bodyText}>{parsed.cause}</Text>

            <Text variant="titleMedium" style={[styles.sectionHeader, { marginTop: 15 }]}>Precautions</Text>
            {parsed.precautions.map((p, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <MaterialCommunityIcons name="circle-medium" size={20} color="#2a9d8f" />
                <Text style={styles.bodyText}>{p}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* --- PATIENT INFO SUMMARY --- */}
        <Card mode="outlined" style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 10, color: '#555' }}>Patient Profile</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{patientName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age/Gender:</Text>
              <Text style={styles.infoValue}>{patientAgeDisplay} / {patientGender}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* --- DISCLAIMER --- */}
        <Text style={styles.disclaimer}>
          ⚠️ Disclaimer: This result is AI-generated. It is not a substitute for professional medical advice, diagnosis, or treatment.
        </Text>

        {/* --- ACTIONS --- */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            icon="printer"
            onPress={handlePrint}
            style={styles.printButton}
            contentStyle={{ height: 50 }}
          >
            Generate Medical Report
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push("/")}
            style={styles.homeButton}
          >
            Back to Home
          </Button>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  successHeader: { color: '#2a9d8f', fontWeight: '700', marginTop: 5 },
  dateText: { color: '#666', fontSize: 12 },

  card: { width: '100%', maxWidth: 500, borderRadius: 16, marginBottom: 16, backgroundColor: '#fff' },
  cardTitle: { textAlign: 'center', color: '#333', marginBottom: 15, fontWeight: '600' },

  imageRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  imageWrapper: { flex: 1, alignItems: 'center' },
  imageLabel: { marginBottom: 6, fontSize: 12, color: '#666', fontWeight: 'bold', textTransform: 'uppercase' },
  imageStyle: { width: '100%', height: 160, borderRadius: 8, backgroundColor: '#f0f0f0' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  captionText: { fontSize: 10, color: '#888', fontStyle: 'italic', marginTop: 10, textAlign: 'center' },

  resultHeader: { alignItems: 'center' },
  diseaseTitle: { fontWeight: 'bold', color: '#d32f2f', marginVertical: 5, textAlign: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 5 },

  sectionHeader: { color: '#2a9d8f', fontWeight: '700', marginBottom: 5 },
  bodyText: { fontSize: 15, color: '#444', lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },

  infoCard: { width: '100%', maxWidth: 500, borderColor: '#ccc', backgroundColor: 'transparent', marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  infoLabel: { color: '#666' },
  infoValue: { fontWeight: '600', color: '#333' },

  disclaimer: { fontSize: 11, color: '#888', textAlign: 'center', marginBottom: 20, fontStyle: 'italic', paddingHorizontal: 10 },

  buttonContainer: { width: '100%', maxWidth: 500, gap: 10 },
  printButton: { backgroundColor: '#2a9d8f', borderRadius: 10 },
  homeButton: { borderRadius: 10, borderColor: '#2a9d8f', textColor: '#2a9d8f' }
});