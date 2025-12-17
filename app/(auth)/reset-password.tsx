// ResetPasswordScreen.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import GlobalAlert, { useAlert } from "@/components/GlobalAlert";

const ResetPasswordScreen: React.FC = () => {
  const { isLoaded, signIn } = useSignIn();
  const router = useRouter();
  const showAlert = useAlert((s) => s.show);
  const { width } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);

  const codeRef = useRef<TextInput>(null);
  const newPassRef = useRef<TextInput>(null);
  const confirmPassRef = useRef<TextInput>(null);

  const isValidEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  /* ---------------- REQUEST RESET ---------------- */
  const handleRequestReset = async () => {
    if (!isLoaded || !signIn) {
      showAlert({
        title: "Please wait",
        message: "Authentication is initializing…",
      });
      return;
    }

    const normalized = email.trim().toLowerCase();

    if (!normalized) {
      showAlert({
        title: "Missing Email",
        message: "Please enter your email address.",
      });
      return;
    }

    if (!isValidEmail(normalized)) {
      showAlert({
        title: "Invalid Email",
        message: "Please enter a valid email address.",
      });
      return;
    }

    try {
      setLoading(true);

      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: normalized,
      });

      showAlert({
        title: "Email Sent",
        message:
          "Check your inbox for a password reset code. Also check spam folder.",
        confirmText: "Continue",
        onConfirm: () => {
          setStep("verify");
          setTimeout(() => codeRef.current?.focus(), 300);
        },
      });
    } catch (err: any) {
      showAlert({
        title: "Error",
        message:
          err?.errors?.[0]?.message ||
          err?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RESET PASSWORD ---------------- */
  const handleResetPassword = async () => {
    if (!isLoaded || !signIn) {
      showAlert({
        title: "Please wait",
        message: "Authentication is initializing…",
      });
      return;
    }

    if (!code.trim() || !newPassword || !confirmPassword) {
      showAlert({
        title: "Missing Fields",
        message: "Please fill in all fields.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({
        title: "Password Mismatch",
        message: "Passwords do not match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      showAlert({
        title: "Weak Password",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    try {
      setLoading(true);

      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword,
      });

      if (result?.status === "complete") {
        showAlert({
          title: "Success",
          message: "Password has been reset successfully!",
          confirmText: "Login",
          onConfirm: () => router.replace("/(auth)/login"),
        });
      } else {
        showAlert({
          title: "Error",
          message: "Unexpected state during password reset.",
        });
      }
    } catch (err: any) {
      showAlert({
        title: "Error",
        message:
          err?.errors?.[0]?.message ||
          err?.message ||
          "Invalid code or password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const horizontalPadding = width > 420 ? 40 : 24;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: horizontalPadding,
            paddingVertical: 24,
          }}
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
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.grey}
                  style={styles.input}
                  onSubmitEditing={handleRequestReset}
                />

                <TouchableOpacity
                  onPress={handleRequestReset}
                  disabled={loading}
                  style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
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
                  placeholder="Enter code"
                  placeholderTextColor={COLORS.grey}
                  style={styles.input}
                  onSubmitEditing={() => newPassRef.current?.focus()}
                />

                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={newPassRef}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter new password"
                    placeholderTextColor={COLORS.grey}
                    style={styles.passwordInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((s) => !s)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color={COLORS.grey}
                    />
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
                    placeholderTextColor={COLORS.grey}
                    style={styles.passwordInput}
                    onSubmitEditing={handleResetPassword}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setShowConfirmPassword((s) => !s)
                    }
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={22}
                      color={COLORS.grey}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={loading}
                  style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ⭐ GLOBAL ALERT */}
      <GlobalAlert />
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 18,
    textAlign: "center",
    color: COLORS.blue,
  },
  label: { color: COLORS.grey, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grey + "40",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grey + "40",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  passwordInput: { flex: 1, paddingVertical: 10 },
  button: {
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  backButton: { marginTop: 16, alignItems: "center" },
  backText: { color: COLORS.blue, fontWeight: "600" },
});
