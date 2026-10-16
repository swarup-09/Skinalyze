import { useAuth } from "@/lib/auth-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signIn, signUp, resetPasswordRequest } = useAuth();
  const router = useRouter();

  const handleAuth = async () => {
    if (isSignUp) {
      if (!name || !email || !password || !confirmPassword) {
        setError("Please fill all fields");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      const err = await signUp(name, email, password);
      if (err) {
        setError(err);
        return;
      }
    } else {
      if (!email || !password) {
        setError("Please enter email and password");
        return;
      }
      const err = await signIn(email, password);
      if (err) {
        setError(err);
        return;
      }
      router.replace("/");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first");
    } else {
      const err = await resetPasswordRequest(email);
      if (err) setError(err);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      enableOnAndroid={true}
      extraScrollHeight={20}
    >
      {/* Top Gradient */}
      <LinearGradient
        colors={["#ff6f61", "#9c27b0"]}
        style={styles.topGradient}
      />

      <View style={styles.formContainer}>
        <Image
          source={require("@/assets/images/appicon.png")}
          style={styles.logo}
        />

        <Text style={styles.subtitle}>
          {isSignUp ? "Sign up to get started" : "Sign in to your account"}
        </Text>

        {/* Name - Only for Sign Up */}
        {isSignUp && (
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color="#999" style={styles.icon} />
            <TextInput
              placeholder="Name"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        {/* Email */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color="#999" style={styles.icon} />
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="#999" style={styles.icon} />
          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password - Only for Sign Up */}
        {isSignUp && (
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color="#999" style={styles.icon} />
            <TextInput
              placeholder="Confirm Password"
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
        )}


        {/* Error message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Forgot password link - only signin */}
        {!isSignUp && (
          <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
            <Text style={styles.forgotText}>Forgot your password?</Text>
          </TouchableOpacity>
        )}

        {/* Submit Button */}
        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <LinearGradient
            colors={["#9c27b0", "#ff6f61"]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {isSignUp ? "Create" : "Sign in"}
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Switch Mode */}
        <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setError(null); }}>
          <Text style={styles.switchText}>
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Create"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Gradient */}
      <LinearGradient
        colors={["#9c27b0", "#ff6f61"]}
        style={styles.bottomGradient}
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topGradient: {
    height: 120,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  bottomGradient: {
    height: 100,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    marginTop: -40,
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 20,
    resizeMode: "contain",
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,

  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  input: { flex: 1, padding: 10 },
  icon: { marginRight: 8 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 12 },
  forgotText: { color: "#9c27b0", fontSize: 14 },
  button: { marginTop: 12, borderRadius: 12, overflow: "hidden" },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", fontSize: 18, marginRight: 8 },
  switchText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#333",
  },
  errorText: { color: "red", textAlign: "center", marginBottom: 12 },
});