import { useAuth } from "@/lib/auth-context";
import { View, Text, StyleSheet, Image, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  return (
    <View style={styles.screen}>
      {/* Top Gradient */}
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]} // A more subtle gradient palette
        style={styles.topBackground}
      />
      <View style={styles.container}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {user?.prefs?.profileImage ? (
            <Image
              source={{ uri: user.prefs.profileImage }}
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
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <LinearGradient
            colors={["#e63946", "#f4a261"]} // A new gradient for the button
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
            <MaterialIcons name="logout" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Light grey background for a clean look
  },
  topBackground: {
    height: 200, // Make this section larger
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
    marginTop: 100, // Push content down to avoid overlapping the gradient
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
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#fff", // White border around the image
  },
  placeholder: {
    backgroundColor: "#192f6a", // Use a color from the gradient
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
  button: {
    borderRadius: 12,
    overflow: "hidden",
    width: "80%", // Make the button wider
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