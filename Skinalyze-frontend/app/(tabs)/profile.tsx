import { useAuth } from "@/lib/auth-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
// 1. Import QR Code Library
import QRCode from 'react-native-qrcode-svg';

export default function ProfileScreen() {
  const { user, userData, signOut, updateUserData, isLoadingUserData } = useAuth();
  const router = useRouter();
  
  // State for Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "",
    phone: "",
    altphone: "",
  });

  // State for Modals
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false); // 2. New State for QR Modal
  
  const [phoneError, setPhoneError] = useState("");
  const [altPhoneError, setAltPhoneError] = useState("");
  const genderOptions = ["Male", "Female", "Other"];

  // 3. Prepare Data for QR Code
  // We encode the user data into a JSON string so the scanner can read it immediately
  const qrData = JSON.stringify({
    id: user?.$id,
    name: user?.name,
    email: user?.email,
    phone: userData?.phone || "N/A",
    dob: userData?.dob || "N/A",
    gender: userData?.gender || "N/A",
    type: "SKINALYZE_PROFILE" // Tag to identify this QR belongs to your app
  });

  useEffect(() => {
    if (userData) {
      let formattedDob = "";
      if (userData.dob) {
        try {
          if (userData.dob.includes('T')) {
            formattedDob = userData.dob.split('T')[0];
          } else {
            formattedDob = userData.dob;
          }
        } catch (error) {
          formattedDob = userData.dob;
        }
      }
      
      setFormData({
        fullName: userData.fullName || "",
        dob: formattedDob,
        gender: userData.gender || "",
        phone: userData.phone || "",
        altphone: userData.altphone || "",
      });
    }
  }, [userData]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  const handleEdit = () => { setIsEditing(true); };

  const handleCancel = () => {
    setIsEditing(false);
    if (userData) {
      // (Reset logic same as before...)
      let formattedDob = userData.dob && userData.dob.includes('T') ? userData.dob.split('T')[0] : userData.dob;
      setFormData({
        fullName: userData.fullName || "",
        dob: formattedDob || "",
        gender: userData.gender || "",
        phone: userData.phone || "",
        altphone: userData.altphone || "",
      });
    }
  };

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
    setShowGenderModal(false);
  };

  const validatePhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/^\+91/, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleanPhone);
  };

  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) return cleanPhone.substring(2);
    if (cleanPhone.length === 10) return cleanPhone;
    return cleanPhone;
  };

  const handlePhoneChange = (phone: string, field: 'phone' | 'altphone') => {
    const formattedPhone = formatPhoneNumber(phone);
    setFormData(prev => ({ ...prev, [field]: formattedPhone }));
    
    if (formattedPhone && !validatePhoneNumber(formattedPhone)) {
      if (field === 'phone') setPhoneError("Invalid Indian mobile number");
      else setAltPhoneError("Invalid Indian mobile number");
    } else {
      setPhoneError("");
      setAltPhoneError("");
    }
  };

  const handleSave = async () => {
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      setPhoneError("Invalid number");
      return;
    }
    if (formData.altphone && !validatePhoneNumber(formData.altphone)) {
      setAltPhoneError("Invalid number");
      return;
    }

    try {
      const error = await updateUserData(formData);
      if (error) Alert.alert("Error", error);
      else {
        Alert.alert("Success", "Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#4c669f", "#3b5998", "#192f6a"]} style={styles.topBackground} />
      
      <View style={styles.container}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          
          {/* 4. QR Code Button (Top Right of Card) */}
          <TouchableOpacity 
            style={styles.qrIconContainer} 
            onPress={() => setShowQrModal(true)}
          >
            <MaterialIcons name="qr-code-scanner" size={24} color="#4c669f" />
          </TouchableOpacity>

          {user?.prefs && 'profileImage' in user.prefs && user.prefs.profileImage ? (
            <Image source={{ uri: user.prefs.profileImage as string }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholder]}>
              <Text style={styles.placeholderText}>{user?.name?.[0]?.toUpperCase() || "U"}</Text>
            </View>
          )}

          <Text style={styles.name}>{user?.name || "User Name"}</Text>
          <Text style={styles.email}>{user?.email || "user@example.com"}</Text>

          {/* Account Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color="#666" />
              <Text style={styles.infoText}>Joined: {user?.$createdAt?.split("T")[0] || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="update" size={20} color="#666" />
              <Text style={styles.infoText}>Last active: {user?.$updatedAt?.split("T")[0] || "N/A"}</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Profile Information</Text>
            
            {isLoadingUserData ? (
              <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading...</Text></View>
            ) : (
              <View style={styles.formFields}>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                    editable={isEditing}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaterialIcons name="cake" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    placeholder="YYYY-MM-DD"
                    value={formData.dob}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, dob: text }))}
                    editable={isEditing}
                  />
                </View>

                <TouchableOpacity 
                  style={styles.inputContainer} 
                  onPress={() => isEditing && setShowGenderModal(true)}
                  disabled={!isEditing}
                >
                  <MaterialIcons name="wc" size={20} color="#666" style={styles.inputIcon} />
                  <Text style={[styles.input, !isEditing && styles.inputDisabled]}>
                    {formData.gender || "Select Gender"}
                  </Text>
                  {isEditing && <MaterialIcons name="arrow-drop-down" size={24} color="#666" />}
                </TouchableOpacity>

                <View style={styles.phoneInputContainer}>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="phone" size={20} color="#666" style={styles.inputIcon} />
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={[styles.phoneInput, !isEditing && styles.inputDisabled]}
                      placeholder="Phone"
                      value={formData.phone}
                      onChangeText={(text) => handlePhoneChange(text, 'phone')}
                      editable={isEditing}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                </View>

                <View style={styles.phoneInputContainer}>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="phone-android" size={20} color="#666" style={styles.inputIcon} />
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={[styles.phoneInput, !isEditing && styles.inputDisabled]}
                      placeholder="Alt Phone"
                      value={formData.altphone}
                      onChangeText={(text) => handlePhoneChange(text, 'altphone')}
                      editable={isEditing}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  {altPhoneError ? <Text style={styles.errorText}>{altPhoneError}</Text> : null}
                </View>
              </View>
            )}

            <View style={styles.buttonContainer}>
              {!isEditing ? (
                <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                  <MaterialIcons name="edit" size={20} color="#4c669f" />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 5. QR Code Modal */}
        <Modal
          visible={showQrModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowQrModal(false)}
        >
           <View style={styles.modalOverlay}>
            <View style={styles.qrModalContent}>
              <Text style={styles.modalTitle}>My Patient ID</Text>
              <Text style={styles.qrSubtitle}>Show this to your doctor</Text>
              
              <View style={styles.qrWrapper}>
                <QRCode 
                  value={qrData} 
                  size={200} 
                  logoBackgroundColor='transparent'
                />
              </View>

              <TouchableOpacity style={styles.closeQrButton} onPress={() => setShowQrModal(false)}>
                <Text style={styles.closeQrText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Gender Modal */}
        <Modal
          visible={showGenderModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowGenderModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              {genderOptions.map((option) => (
                <TouchableOpacity key={option} style={styles.modalOption} onPress={() => handleGenderSelect(option)}>
                  <Text style={styles.modalOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowGenderModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LinearGradient colors={["#e63946", "#f4a261"]} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Sign Out</Text>
            <MaterialIcons name="logout" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ... (Keep all your existing styles) ...
  screen: { flex: 1, backgroundColor: "#f5f5f5" },
  topBackground: { height: 200, position: "absolute", top: 0, left: 0, right: 0, borderBottomLeftRadius: 50, borderBottomRightRadius: 50 },
  container: { flex: 1, alignItems: "center", padding: 20, marginTop: 70 },
  
  profileCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 20, alignItems: "center", width: "100%",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }, android: { elevation: 8 } }),
    marginBottom: 20,
    position: 'relative' // Needed for absolute positioning of QR Icon
  },
  
  // NEW STYLES FOR QR
  qrIconContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 50,
    zIndex: 10
  },
  qrModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: "85%",
    alignItems: 'center',
    elevation: 5
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginVertical: 20
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  closeQrButton: {
    backgroundColor: '#4c669f',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10
  },
  closeQrText: {
    color: 'white',
    fontWeight: 'bold'
  },

  // ... (Rest of your existing styles) ...
  formSection: { width: "100%", marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16, borderWidth: 3, borderColor: "#fff" },
  placeholder: { backgroundColor: "#192f6a", justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#fff", fontSize: 40, fontWeight: "600" },
  name: { fontSize: 26, fontWeight: "bold", color: "#333" },
  email: { fontSize: 16, color: "#888", marginBottom: 20 },
  infoSection: { width: "100%", paddingHorizontal: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8f8f8", padding: 12, borderRadius: 10, marginBottom: 10 },
  infoText: { fontSize: 14, color: "#555", marginLeft: 10 },
  formTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 16, textAlign: "center" },
  buttonContainer: { marginTop: 20, alignItems: "center" },
  editButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#f0f4ff", borderRadius: 12, borderWidth: 1, borderColor: "#4c669f" },
  editButtonText: { color: "#4c669f", fontSize: 16, fontWeight: "600", marginLeft: 8 },
  editActions: { flexDirection: "row", gap: 12 },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#f5f5f5", borderRadius: 12, borderWidth: 1, borderColor: "#ddd" },
  cancelButtonText: { color: "#666", fontSize: 16, fontWeight: "600" },
  saveButton: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#4c669f", borderRadius: 12 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loadingContainer: { padding: 20, alignItems: "center" },
  loadingText: { color: "#666", fontSize: 16 },
  formFields: { gap: 16 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8f8f8", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#333", paddingVertical: 12 },
  inputDisabled: { color: "#999" },
  phoneInputContainer: { marginBottom: 4 },
  phoneInput: { flex: 1, fontSize: 16, color: "#333", paddingVertical: 12, paddingLeft: 8 },
  countryCode: { fontSize: 16, color: "#666", fontWeight: "600", paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: "#ddd" },
  errorText: { color: "#dc3545", fontSize: 12, marginTop: 4, marginLeft: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 20, width: "80%", maxWidth: 300 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333", textAlign: "center", marginBottom: 20 },
  modalOption: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  modalOptionText: { fontSize: 16, color: "#333", textAlign: "center" },
  modalCancel: { paddingVertical: 15, paddingHorizontal: 20, marginTop: 10, backgroundColor: "#f5f5f5", borderRadius: 10 },
  modalCancelText: { fontSize: 16, color: "#666", textAlign: "center", fontWeight: "600" },
  signOutButton: { borderRadius: 12, overflow: "hidden", width: "80%", marginBottom: 20 },
  buttonGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600", marginRight: 8 },
});