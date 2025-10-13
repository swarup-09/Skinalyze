import { useAuth } from "@/lib/auth-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { user, userData, signOut, updateUserData, isLoadingUserData } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "",
    phone: "",
    altphone: "",
  });
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [altPhoneError, setAltPhoneError] = useState("");
  const genderOptions = ["Male", "Female", "Other"];

  useEffect(() => {
    if (userData) {
      // Format DOB to be more user-friendly
      let formattedDob = "";
      if (userData.dob) {
        try {
          // If it's a full timestamp, extract just the date part
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
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
  };

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
    setShowGenderModal(false);
  };

  const validatePhoneNumber = (phone: string) => {
    // Remove +91 prefix for validation
    const cleanPhone = phone.replace(/^\+91/, '');
    // Indian mobile number validation (10 digits starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleanPhone);
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If it starts with 91, remove it
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      return cleanPhone.substring(2);
    }
    
    // If it's 10 digits, return as is
    if (cleanPhone.length === 10) {
      return cleanPhone;
    }
    
    // For other cases, return the cleaned phone
    return cleanPhone;
  };

  const handlePhoneChange = (phone: string, field: 'phone' | 'altphone') => {
    const formattedPhone = formatPhoneNumber(phone);
    setFormData(prev => ({ ...prev, [field]: formattedPhone }));
    
    // Validate phone number
    if (formattedPhone && !validatePhoneNumber(formattedPhone)) {
      if (field === 'phone') {
        setPhoneError("Please enter a valid 10-digit Indian mobile number");
      } else {
        setAltPhoneError("Please enter a valid 10-digit Indian mobile number");
      }
    } else {
      if (field === 'phone') {
        setPhoneError("");
      } else {
        setAltPhoneError("");
      }
    }
  };

  const handleSave = async () => {
    // Validate phone numbers before saving
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    
    if (formData.altphone && !validatePhoneNumber(formData.altphone)) {
      setAltPhoneError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    try {
      const error = await updateUserData(formData);
      if (error) {
        Alert.alert("Error", error);
      } else {
        Alert.alert("Success", "Profile updated successfully!");
        setIsEditing(false);
        setPhoneError("");
        setAltPhoneError("");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };


  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* Top Gradient */}
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}  
        style={styles.topBackground}
      />
      
      <View style={styles.container}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {user?.prefs && 'profileImage' in user.prefs && user.prefs.profileImage ? (
            <Image
              source={{ uri: user.prefs.profileImage as string }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.placeholder]}>
              <Text style={styles.placeholderText}>
                {user?.name?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
          )}

          <Text style={styles.name}>{user?.name || "User Name"}</Text>
          <Text style={styles.email}>{user?.email || "user@example.com"}</Text>

          {/* Account Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color="#666" />
              <Text style={styles.infoText}>
                Joined: {user?.$createdAt?.split("T")[0] || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="update" size={20} color="#666" />
              <Text style={styles.infoText}>
                Last active: {user?.$updatedAt?.split("T")[0] || "N/A"}
              </Text>
            </View>
          </View>

          {/* Profile Information Form */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Profile Information</Text>
            
            {isLoadingUserData ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading profile data...</Text>
              </View>
            ) : (
              <View style={styles.formFields}>
                {/* Full Name */}
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

                {/* Date of Birth */}
                <View style={styles.inputContainer}>
                  <MaterialIcons name="cake" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    placeholder="Date of Birth (YYYY-MM-DD)"
                    value={formData.dob}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, dob: text }))}
                    editable={isEditing}
                  />
                </View>

                {/* Gender */}
                <TouchableOpacity 
                  style={styles.inputContainer} 
                  onPress={() => isEditing && setShowGenderModal(true)}
                  disabled={!isEditing}
                >
                  <MaterialIcons name="wc" size={20} color="#666" style={styles.inputIcon} />
                  <Text style={[styles.input, !isEditing && styles.inputDisabled, !formData.gender && styles.placeholderText]}>
                    {formData.gender || "Select Gender"}
                  </Text>
                  {isEditing && <MaterialIcons name="arrow-drop-down" size={24} color="#666" />}
                </TouchableOpacity>

                {/* Phone */}
                <View style={styles.phoneInputContainer}>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="phone" size={20} color="#666" style={styles.inputIcon} />
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={[styles.phoneInput, !isEditing && styles.inputDisabled]}
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChangeText={(text) => handlePhoneChange(text, 'phone')}
                      editable={isEditing}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                </View>

                {/* Alternative Phone */}
                <View style={styles.phoneInputContainer}>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="phone-android" size={20} color="#666" style={styles.inputIcon} />
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={[styles.phoneInput, !isEditing && styles.inputDisabled]}
                      placeholder="Alternative Phone"
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

            {/* Edit/Save/Cancel Buttons */}
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

        {/* Gender Selection Modal */}
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
                <TouchableOpacity
                  key={option}
                  style={styles.modalOption}
                  onPress={() => handleGenderSelect(option)}
                >
                  <Text style={styles.modalOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowGenderModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LinearGradient
            colors={["#e63946", "#f4a261"]}  
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
            <MaterialIcons name="logout" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f5", 
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
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    marginTop: 70,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
    marginBottom: 20,
  },
  formSection: {
    width: "100%",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#fff",
  },
  placeholder: {
    backgroundColor: "#192f6a", 
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#fff", fontSize: 40, fontWeight: "600" },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
  },
  infoSection: {
    width: "100%",
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoText: { fontSize: 14, color: "#555", marginLeft: 10 },
  
  // Form Styles
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4c669f",
  },
  editButtonText: {
    color: "#4c669f",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#4c669f",
    borderRadius: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: 16,
  },
  formFields: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
  },
  inputDisabled: {
    color: "#999",
  },
  
  // Phone Input Styles
  phoneInputContainer: {
    marginBottom: 4,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
    paddingLeft: 8,
  },
  countryCode: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  modalCancel: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontWeight: "600",
  },
  
  // Sign Out Button
  signOutButton: {
    borderRadius: 12,
    overflow: "hidden",
    width: "80%",
    marginBottom: 20,
  },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
});