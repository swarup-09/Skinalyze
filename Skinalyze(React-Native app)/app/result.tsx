import React from 'react';
import { View, ScrollView, StyleSheet, Image, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card, Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
// ⭐️ IMPORT useAuth ⭐️
import { useAuth } from "@/lib/auth-context"; 


// 1. Result Type Definition (remains the same as our last successful version)
type ResultType = {
  cause: string;
  confidence: number;
  precautions: string[];
  predicted_disease: string;
  success: boolean;
  grad_cam_image_base64: string; 
};

export default function ResultScreen() {
  const { data, imageUri } = useLocalSearchParams<{ data: string; imageUri: string }>();
  const parsed: ResultType = JSON.parse(data);

  // ⭐️ ACCESS BOTH user AND userData ⭐️
  const { user, userData, isLoadingUserData } = useAuth(); 

  // 2. Prepare Data for Display/Print
  // User data from Appwrite Account
  const userEmail = user?.email || "N/A";

  // Detailed user data from Appwrite Database (userData)
  const patientName = userData?.fullName || user?.name || "Patient Name N/A";
  const patientDOB = userData?.dob || "N/A";
  const patientGender = userData?.gender || "N/A";
  const patientPhone = userData?.phone || userEmail; // Use phone, fallback to email if phone is empty
  
  const gradCamUri = parsed.grad_cam_image_base64 ? 
    `data:image/png;base64,${parsed.grad_cam_image_base64}` : null;

  const screenWidth = Dimensions.get('window').width;
  const imageWidth = screenWidth - 50;

  // Function to calculate age from DOB string (simple estimate)
  const calculateAge = (dobString: string) => {
      if (!dobString) return 'N/A';
      try {
        const birthDate = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? `${age} years` : 'N/A';
      } catch (e) {
        return 'N/A';
      }
  };
  
  const patientAgeDisplay = calculateAge(patientDOB);

  const handlePrint = async () => {
    // 3. Update HTML with dynamic patient data
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f4f4f9; }
            .header { text-align: center; font-size: 24px; font-weight: bold; color: #2a9d8f; margin-bottom: 20px; }
            .card { background: white; border: 2px solid #333; border-radius: 12px; padding: 16px; margin-bottom: 24px; box-shadow: 2px 2px 6px rgba(0,0,0,0.2); }
            .section-title { font-size: 18px; font-weight: bold; color: #2a9d8f; margin-top: 10px; }
            .section-content { font-size: 16px; margin-left: 10px; margin-top: 4px; }
            .image-container { display: flex; justify-content: space-around; margin-top: 15px; flex-wrap: wrap; }
            .image-box { width: 45%; text-align: center; margin-bottom: 15px; }
            .image { width: 100%; max-width: 200px; border-radius: 12px; margin-top: 5px; border: 1px solid #ccc; }
            ul { padding-left: 20px; }
            .notes { min-height: 80px; border: 1px dashed #999; border-radius: 8px; padding: 8px; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">Skinalyze - Dermatology Consultation Report</div>

          <div class="card">
            <div class="section-title">ML Prediction</div>
            <div class="section-content">
              Disease: <strong>${parsed.predicted_disease}</strong><br />
              Confidence: <strong>${parsed.confidence.toFixed(2)}%</strong><br />
              Cause: ${parsed.cause}
            </div>

            <div class="section-title">Skin Visualization</div>
            <div class="image-container">
                <div class="image-box">
                    <img src="${imageUri}" class="image" />
                </div>
                ${gradCamUri ? `
                <div class="image-box">
                    <img src="${gradCamUri}" class="image" />
                </div>` : ''}
            </div>

            <div class="section-title">Precautions / Recommendations</div>
            <div class="section-content">
              <ul>
                ${parsed.precautions.map(p => `<li>${p}</li>`).join('')}
              </ul>
            </div>
            
            <div class="section-title">Patient Info</div>
            <div class="section-content">
              Name: ${patientName}<br />
              Age: ${patientAgeDisplay}<br />
              Gender: ${patientGender}<br />
              Contact: ${patientPhone}
            </div>

            <div class="section-title">Dermatologist Consultation Notes</div>
            <div class="notes">
              <!-- Dermatologist can write here -->
            </div>

            <div class="section-title">Dermatologist Info</div>
            <div class="section-content">
              Dr. Jane Smith, MD<br />
              XYZ Dermatology Clinic<br />
              Contact: 987-654-3210
            </div>
          </div>
        </body>
      </html>
    `;

    await Print.printAsync({ html: htmlContent });
  };


  if (isLoadingUserData) {
    // Show loading indicator while Appwrite data is being fetched
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2a9d8f" />
            <Text style={{ marginTop: 10 }}>Loading patient data...</Text>
        </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <LinearGradient
        colors={['#84fab0', '#8fd3f4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <Text variant="headlineSmall" style={styles.successHeader}>
              ✅ Prediction Success
          </Text>

          {/* Combined Image Card */}
          <Card mode="elevated" style={[styles.imageCard, { width: imageWidth }]}>
            <Card.Content>
              {/* Original Image */}
              <Text variant="titleMedium" style={styles.imageLabel}>Original Image</Text>
              <Image
                source={{ uri: imageUri }}
                style={styles.imageStyle}
                resizeMode="cover"
                loadingIndicatorSource={Platform.OS === 'ios' ? { uri: 'data:image/png;base64,' } : undefined}
              />
              
              {/* Grad-CAM Image */}
              <Text variant="titleMedium" style={[styles.imageLabel, { marginTop: 15 }]}>AI-Processed</Text>
              {gradCamUri ? (
                <Image
                  source={{ uri: gradCamUri }}
                  style={styles.imageStyle}
                  resizeMode="cover"
                  loadingIndicatorSource={Platform.OS === 'ios' ? { uri: 'data:image/png;base64,' } : undefined}
                />
              ) : (
                <ActivityIndicator size="large" color="#4c669f" style={{ marginTop: 20 }} />
              )}
            </Card.Content>
          </Card>

          {/* Prediction Details Card */}
          <Card mode='elevated' style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={{textAlign: 'center', marginBottom: 15, color: '#2a9d8f'}}>
                Prediction Details
              </Text>
              
              {/* Patient Info Display */}
              <Text variant="titleMedium" style={styles.label}>Patient Name</Text>
              <Text variant="bodyMedium">{patientName}</Text>
              
              <Text variant="titleMedium" style={styles.label}>Age / Gender</Text>
              <Text variant="bodyMedium">{patientAgeDisplay} / {patientGender}</Text>
              
              <Text variant="titleMedium" style={styles.label}>Contact</Text>
              <Text variant="bodyMedium">{patientPhone}</Text>
              
              <View style={styles.divider} />

              {/* Disease Details */}
              <Text variant="titleMedium" style={styles.label}>Predicted Disease</Text>
              <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#ff6f61' }}>{parsed.predicted_disease}</Text>

              <Text variant="titleMedium" style={styles.label}>Confidence</Text>
              <Text variant="bodyMedium">{parsed.confidence.toFixed(2)}%</Text>

              <Text variant="titleMedium" style={styles.label}>Cause</Text>
              <Text variant="bodyMedium">{parsed.cause}</Text>

              <Text variant="titleMedium" style={styles.label}>Precautions</Text>
              {parsed.precautions.map((p, idx) => (
                <Text key={idx} variant="bodyMedium" style={styles.bullet}>
                  • {p}
                </Text>
              ))}

              <Button
                mode="contained"
                style={{ marginTop: 20, backgroundColor: '#2a9d8f' }}
                onPress={handlePrint}
              >
                Print Report (PDF) 📄
              </Button>
            </Card.Content>
          </Card>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  imageCard: {
    borderRadius: 16,
    marginBottom: 24,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'black',
    width: '100%',
    maxWidth: 500,
  },
  card: {
    borderWidth: 2,
    borderColor: 'black',
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    elevation: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  successHeader: {
    marginTop: 20,
    marginBottom: 20,
    color: '#198754',
    fontWeight: '700',
    textAlign: 'center',
  },
  imageLabel: {
    marginBottom: 8,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  imageStyle: { 
    height: 200, 
    width: '100%', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#ccc' 
  },
  label: {
    marginTop: 8,
    fontWeight: '600',
  },
  bullet: {
    marginLeft: 10,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  }
});