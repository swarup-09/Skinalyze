import EvilIcons from '@expo/vector-icons/EvilIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';

// Reusable button components for better code organization
const PrimaryButton = ({ onPress, text, icon, disabled }: any) => (
  <TouchableOpacity
    style={[styles.primaryButton, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled}>
    <LinearGradient colors={['#a1c4fd', '#c2e9fb']} style={styles.primaryButtonGradient}>
      {icon}
      <Text style={styles.primaryButtonText}>{text}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const SecondaryButton = ({ onPress, text, icon, disabled }: any) => (
  <TouchableOpacity
    style={[styles.secondaryButton, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled}>
    {icon}
    <Text style={styles.secondaryButtonText}>{text}</Text>
  </TouchableOpacity>
);

export default function Index() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const pickImage = useCallback(async (fromCamera: boolean) => {
    const pickerOptions = { allowsEditing: true, quality: 0.8 };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const uploadImage = useCallback(async () => {
    if (!imageUri) return Alert.alert('No image selected.');

    setUploading(true);
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image';
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

    const base64Uri = `data:${type};base64,${base64}`;
    const formData = new FormData();
    formData.append('image', { uri: imageUri, name: filename, type } as any);

    try {
      const res = await fetch('http://10.195.162.46:5000/predict', {
        method: 'POST',
        body: formData,
        headers: { 'content-type': 'multipart/form-data' },
      });
      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }
      const json = await res.json();
      router.push({
        pathname: '/result',
        params: { data: JSON.stringify(json), imageUri: base64Uri },
      });
    } catch (error: any) {
      console.error('Upload failed:', error);
      Alert.alert('Upload failed', `An error occurred: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, [imageUri, router]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={['#F0F4F8', '#E6EEF5']} style={styles.container}>
              <LinearGradient
                colors={["#4c669f", "#3b5998", "#192f6a"]} // A more subtle gradient palette
                style={styles.topBackground}
              />
        <View style={styles.card}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="image-outline" size={60} color="#B0BEC5" />
              <Text style={styles.placeholderText}>Select an image to get started.</Text>
            </View>
          )}

          {imageUri && (
            <PrimaryButton
              onPress={uploadImage}
              text={uploading ? 'Analyzing...' : 'Analyze Image'}
              disabled={uploading}
              icon={
                uploading ? (
                  <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons
                    name="analytics-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                )
              }
            />
          )}
        </View>

        <View style={styles.buttonContainer}>
          <SecondaryButton
            onPress={() => pickImage(true)}
            text="Capture Image"
            disabled={uploading}
            icon={<EvilIcons name="camera" size={24} color="#616161" style={{ marginRight: 8 }} />}
          />
          <SecondaryButton
            onPress={() => pickImage(false)}
            text="Upload from Gallery"
            disabled={uploading}
            icon={<EvilIcons name="image" size={24} color="#616161" style={{ marginRight: 8 }} />}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
    topBackground: {
    height: 200,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  preview: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    width: '100%',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#616161',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});