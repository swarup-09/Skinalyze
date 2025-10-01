import React from 'react';
import { View, ScrollView, StyleSheet, Image, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card, Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';

type ResultType = {
  cause: string;
  confidence: number;
  precautions: string[];
  predicted_disease: string;
  success: boolean;
};

export default function ResultScreen() {
  const { data, imageUri } = useLocalSearchParams<{ data: string; imageUri: string }>();
  const parsed: ResultType = JSON.parse(data);

  const screenWidth = Dimensions.get('window').width;
  const imageWidth = screenWidth - 50;

const handlePrint = async () => {
  const htmlContent = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f4f4f9;
          }
          .header {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #2a9d8f;
            margin-bottom: 20px;
          }
          .card {
            background: white;
            border: 2px solid #333;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            box-shadow: 2px 2px 6px rgba(0,0,0,0.2);
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2a9d8f;
            margin-top: 10px;
          }
          .section-content {
            font-size: 16px;
            margin-left: 10px;
            margin-top: 4px;
          }
          .image {
            width: 100%;
            max-width: 200px;
            border-radius: 12px;
            margin-top: 10px;
            margin-bottom: 10px;
          }
          ul {
            padding-left: 20px;
          }
          .notes {
            min-height: 80px;
            border: 1px dashed #999;
            border-radius: 8px;
            padding: 8px;
            margin-top: 6px;
          }
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

          <div class="section-title">Precautions / Recommendations</div>
          <div class="section-content">
            <ul>
              ${parsed.precautions.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>

          <div class="section-title">Skin/Disease Image</div>
          <img src="${imageUri}" class="image" />

          <div class="section-title">Patient Info</div>
          <div class="section-content">
            Name: John Doe<br />
            Age: 30<br />
            Gender: Male<br />
            Contact: 123-456-7890
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




  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <LinearGradient
        colors={['#84fab0', '#8fd3f4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <Card mode="elevated" style={[styles.imageCard, { width: imageWidth }]}>
            <Image
              source={{ uri: imageUri }}
              style={{ height: 260, width: '100%', borderRadius: 12 }}
              resizeMode="cover"
            />
          </Card>

          <Card mode='elevated' style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.success}>
                ✅ Prediction Success
              </Text>

              <Text variant="titleMedium" style={styles.label}>Disease</Text>
              <Text variant="bodyMedium">{parsed.predicted_disease}</Text>

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
                style={{ marginTop: 20 }}
                onPress={handlePrint}
              >
                Print Result
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
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCard: {
    borderRadius: 16,
    marginBottom: 24,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'black',
  },
  card: {
    borderWidth: 2,
    borderColor: 'black',
    width: '100%',
    borderRadius: 16,
    elevation: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    overflow: 'hidden'
  },
  success: {
    marginBottom: 12,
    color: '#198754',
    fontWeight: '600',
  },
  label: {
    marginTop: 8,
    fontWeight: '600',
  },
  bullet: {
    marginLeft: 10,
    marginTop: 2,
  },
});
