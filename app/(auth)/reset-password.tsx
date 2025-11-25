// ResetPasswordScreen.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,

  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * ResetPasswordScreen
 * - Step 1: request a reset code to email
 * - Step 2: verify code & set new password
 *
 * Improvements:
 * - SafeAreaView for notches
 * - KeyboardAvoidingView + keyboardShouldPersistTaps
 * - Loading states & disabled buttons to avoid double submits
 * - Field validation, trimming & normalization
 * - Accessibility labels and hitSlop on icon buttons
 * - Responsive paddings using useWindowDimensions
 */
const ResetPasswordScreen: React.FC = () => {
  const { isLoaded, signIn } = useSignIn();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // UI / form state
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);

  // Refs for focusing next input
  const codeRef = useRef<TextInput | null>(null);
  const newPassRef = useRef<TextInput | null>(null);
  const confirmPassRef = useRef<TextInput | null>(null);

  // Basic email validator
  const isValidEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  // Request reset code step
  const handleRequestReset = async () => {
    if (!isLoaded || !signIn) {
      Alert.alert("Please wait", "Authentication is initializing...");
      return;
    }

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }
    if (!isValidEmail(normalized)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      // signIn.create with reset_password_email_code strategy asks Clerk to send email code
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: normalized,
      });

      Alert.alert(
        "Email Sent",
        "Check your inbox for a password reset code. If you don't see it, check spam."
      );
      setStep("verify");
      // focus code input shortly after UI update
      setTimeout(() => codeRef.current?.focus(), 300);
    } catch (err: any) {
      const message =
        (err && err.errors && err.errors[0] && err.errors[0].message) ||
        err?.message ||
        "Something went wrong. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  // Verify code and set new password
  const handleResetPassword = async () => {
    if (!isLoaded || !signIn) {
      Alert.alert("Please wait", "Authentication is initializing...");
      return;
    }
    const normalized = email.trim().toLowerCase();

    if (!code.trim() || !newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    // Example password policy: min 6 characters (adjust as needed)
    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      // Use Clerk's attemptFirstFactor for the reset strategy
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword,
      });

      if (result?.status === "complete") {
        Alert.alert("Success", "Password has been reset successfully!");
        router.replace("/(auth)/login");
      } else {
        // Any other intermediate state
        Alert.alert("Error", "Unexpected state during password reset.");
      }
    } catch (err: any) {
      const message =
        (err && err.errors && err.errors[0] && err.errors[0].message) ||
        err?.message ||
        "Invalid code or password.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  // Responsive horizontal padding
  const horizontalPadding = width > 420 ? 40 : 24;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: horizontalPadding,
            paddingVertical: 24,
            backgroundColor: COLORS.background,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Reset Password</Text>

            {step === "request" ? (
              <>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="Enter your email"
                  placeholderTextColor="#9AA0A6"
                  style={styles.input}
                  returnKeyType="send"
                  onSubmitEditing={handleRequestReset}
                  accessible
                  accessibilityLabel="Email input"
                  textContentType="username"
                />

                <TouchableOpacity
                  onPress={handleRequestReset}
                  style={[styles.button, loading ? styles.buttonDisabled : null]}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  {loading ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  ref={codeRef}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  placeholder="Enter code from email"
                  placeholderTextColor="#9AA0A6"
                  style={styles.input}
                  returnKeyType="next"
                  onSubmitEditing={() => newPassRef.current?.focus()}
                  accessible
                  accessibilityLabel="Verification code input"
                />

                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={newPassRef}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#9AA0A6"
                    style={styles.passwordInput}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPassRef.current?.focus()}
                    accessible
                    accessibilityLabel="New password input"
                    textContentType="newPassword"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((s) => !s)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={COLORS.grey} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={confirmPassRef}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9AA0A6"
                    style={styles.passwordInput}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                    accessible
                    accessibilityLabel="Confirm password input"
                    textContentType="password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((s) => !s)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color={COLORS.grey} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleResetPassword}
                  style={[styles.button, loading ? styles.buttonDisabled : null]}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator size="small" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
            >
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;

/* styles */
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 18,
    textAlign: "center",
    color: COLORS.blue,
  },
  label: { color: COLORS.grey, marginTop: 6, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grey + "40",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grey + "40",
    borderRadius: 10,
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 14,
  },
  button: {
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
  backButton: { marginTop: 16, alignItems: "center" },
  backText: { color: COLORS.blue, fontWeight: "600" },
});
