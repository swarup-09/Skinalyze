import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, SafeAreaView, Linking, Alert, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { databases, DATABASE_ID, DERMATOLOGISTS_COLLECTION_ID } from '@/lib/appwrite'; 

type Dermatologist = {
  full_Name: string;
  specialization: string;
  yearsOfExperience: number;
  clinicAddress: string;
  consultationFee: number;
  contact_phone: string;
  contact_email: string;
};

const handleDial = (phoneNumber: string) => {
  const url = `tel:${phoneNumber}`;
  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert(`Call not supported on this device. Number: ${phoneNumber}`);
    }
  }).catch(err => console.error('An error occurred while linking', err));
};

const handleEmail = (emailAddress: string) => {
  const url = `mailto:${emailAddress}`;
  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert(`Email not supported on this device. Address: ${emailAddress}`);
    }
  }).catch(err => console.error('An error occurred while linking', err));
};


const DermatologistCard = ({ dermatologist }: { dermatologist: Dermatologist }) => (
  <View style={styles.card}>
    
    {/* Header Section (Name and Specialty) */}
    <View style={styles.headerRow}>
        <View style={styles.infoContainer}>
            <Text style={styles.doctorName}>{dermatologist.full_Name}</Text>
            <Text style={styles.specialty}>{dermatologist.specialization}</Text>
            <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {dermatologist.yearsOfExperience} Yrs Exp | 
                  Fee: ₹{dermatologist.consultationFee}
                </Text>
            </View>
        </View>
    </View>

    {/* Details Section */}
    <View style={styles.detailRow}>
        <View style={styles.detailItem}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>{dermatologist.clinicAddress}</Text>
        </View>
        <View style={styles.detailItem}>
            <MaterialIcons name="phone" size={16} color="#666" />
            <Text style={styles.detailText}>+91 {dermatologist.contact_phone}</Text>
        </View>
        <View style={styles.detailItem}>
            <MaterialIcons name="email" size={16} color="#666" />
            <Text style={styles.detailText}>{dermatologist.contact_email}</Text>
        </View>
    </View>

    {/* Contact Button Group*/}
    <View style={styles.buttonGroup}>
      {/* Call Button */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => handleDial(dermatologist.contact_phone)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#9c27b0", "#ff6f61"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <MaterialIcons name="call" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Call Now</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Email Button */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => handleEmail(dermatologist.contact_email)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#ff6f61", "#9c27b0"]} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <MaterialIcons name="mail" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Email</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>

  </View>
);

export default function DermatologistsPage() {
  const [dermatologists, setDermatologists] = useState<Dermatologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDermatologists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using the imported databases object and collection IDs
      const response = await databases.listDocuments(
        DATABASE_ID,
        DERMATOLOGISTS_COLLECTION_ID
      );
      // Casting to the Dermatologist type
      setDermatologists(response.documents as Dermatologist[]);
    } catch (e) {
      console.error("Appwrite fetch failed:", e);
      // Provide a more user-friendly error message
      setError("Failed to load specialists. Please check your Appwrite connection and environment variables.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDermatologists();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#9c27b0', '#7b1fa2']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerContainer}
      >
        <Text style={styles.headerTitle}>Find a Dermatologist</Text>
        <Text style={styles.headerSubtitle}>Book a consultation instantly</Text>
      </LinearGradient>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9c27b0" />
          <Text style={styles.loadingText}>Fetching specialists...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="warning" size={24} color="#ff6f61" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchDermatologists} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={dermatologists}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => <DermatologistCard dermatologist={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No dermatologists found.</Text>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f8", 
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 35, 
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800", 
    color: "#fff", 
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#e0e0e0", 
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
    borderLeftWidth: 6,
    borderLeftColor: '#9c27b0', // Primary accent color
  },
  headerRow: {
    marginBottom: 10,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  specialty: {
    fontSize: 14,
    color: "#9c27b0",
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    fontWeight: '500',
  },
  detailRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    paddingBottom: 5,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666",
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  button: {
    flex: 1, 
    borderRadius: 12, 
    overflow: "hidden",
    marginHorizontal: 4, 
  },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: '700', 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#9c27b0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff6f61',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#9c27b0',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  }
});