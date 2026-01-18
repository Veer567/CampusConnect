// SignupScreen.tsx
import GlobalAlert, { useAlert } from "@/components/GlobalAlert";
import { COLORS } from "@/constants/themes";
import { styles as authStyles } from "@/styles/auth.styles";
import { useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const showAlert = useAlert((s) => s.show);
  const { width } = useWindowDimensions();

  /* ---------------- FORM STATE ---------------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const passRef = useRef<TextInput | null>(null);
  const confirmPassRef = useRef<TextInput | null>(null);
  const codeRef = useRef<TextInput | null>(null);

  /* ---------------- EMAIL RULE ---------------- */
  const isAllowedEmail = (e: string) =>
    e.trim().toLowerCase().endsWith("@marwadiuniversity.ac.in");

  /* ---------------- SIGN UP ---------------- */
  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;

    const normalized = email.trim().toLowerCase();

    if (!isAllowedEmail(normalized)) {
      showAlert({
        title: "Access Denied",
        message: "Only @marwadiuniversity.ac.in emails are allowed.",
      });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({
        title: "Password Mismatch",
        message: "Passwords do not match.",
      });
      return;
    }

    if (password.length < 6) {
      showAlert({
        title: "Weak Password",
        message: "Password must be at least 6 characters.",
      });
      return;
    }

    try {
      setLoading(true);

      await signUp.create({
        emailAddress: normalized,
        password,
      });

      await signUp.prepareEmailAddressVerification();
      setIsCodeSent(true);

      showAlert({
        title: "Email Verification",
        message: "A verification code has been sent to your inbox.",
        confirmText: "OK",
        onConfirm: () => {
          setTimeout(() => codeRef.current?.focus(), 300);
        },
      });
    } catch (err: any) {
      showAlert({
        title: "Sign-up Failed",
        message:
          err?.errors?.[0]?.message || err?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VERIFY CODE ---------------- */
  const handleVerifyCode = async () => {
    if (!signUp || !code.trim()) {
      showAlert({
        title: "Missing Code",
        message: "Please enter the 6-digit verification code.",
      });
      return;
    }

    try {
      setVerificationLoading(true);

      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        showAlert({
          title: "Verification Failed",
          message: "Invalid verification code.",
        });
      }
    } catch (err: any) {
      showAlert({
        title: "Verification Failed",
        message:
          err?.errors?.[0]?.message ||
          err?.message ||
          "Invalid or expired code.",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const horizontalPadding = width > 420 ? 40 : 24;

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingVertical: 24,
          }}
        >
          {/* Branding */}
          <View style={authStyles.brandSection}>
            <View style={authStyles.logoContainer}>
              <Image
                style={authStyles.logoContainer}
                resizeMode="contain"
                source={require("@/assets/images/education.png")}
              />
            </View>

            <Text style={[authStyles.appName, { color: COLORS.primary }]}>
              CampusConnect
            </Text>
            <Text style={[authStyles.tagline, { color: COLORS.grey }]}>
              Let&apos;s Connect
            </Text>
          </View>

          {/* Card */}
          <View style={localStyles.card}>
            {!isCodeSent ? (
              <>
                <Text style={localStyles.title}>Create Account</Text>

                <Text style={localStyles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Enter your Marwadi email"
                  placeholderTextColor={COLORS.grey}
                  style={localStyles.input}
                  selectionColor={COLORS.primary}
                  cursorColor={COLORS.primary}
                  onSubmitEditing={() => passRef.current?.focus()}
                />

                <Text style={localStyles.label}>Password</Text>
                <View style={localStyles.passwordRow}>
                  <TextInput
                    ref={passRef}
                    value={password}
                    placeholder="Enter password"
                    onChangeText={setPassword}
                    placeholderTextColor={COLORS.grey}
                    secureTextEntry={!showPassword}
                    style={localStyles.passwordInput}
                    selectionColor={COLORS.primary}
                    cursorColor={COLORS.primary}
                    onSubmitEditing={() => confirmPassRef.current?.focus()}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color={COLORS.text}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={localStyles.label}>Confirm Password</Text>
                <View style={localStyles.passwordRow}>
                  <TextInput
                    ref={confirmPassRef}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor={COLORS.grey}
                    style={localStyles.passwordInput}
                    selectionColor={COLORS.primary}
                    cursorColor={COLORS.primary}
                    onSubmitEditing={handleSignUp}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((p) => !p)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={22}
                      color={COLORS.text}
                    />
                  </TouchableOpacity>
                </View>

                <Pressable
                  onPress={handleSignUp}
                  disabled={loading}
                  style={[
                    localStyles.button,
                    loading && localStyles.buttonDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={localStyles.buttonText}>Sign Up</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={localStyles.title}>Verify Email</Text>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Enter the 6-digit code sent to your Marwadi email:
                </Text>

                <TextInput
                  ref={codeRef}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  placeholder="Enter code"
                  placeholderTextColor={COLORS.grey}
                  maxLength={6}
                  style={localStyles.codeInput}
                  selectionColor={COLORS.primary}
                  cursorColor={COLORS.primary}
                  onSubmitEditing={handleVerifyCode}
                />

                <Pressable
                  onPress={handleVerifyCode}
                  disabled={verificationLoading}
                  style={[
                    localStyles.button,
                    verificationLoading && localStyles.buttonDisabled,
                  ]}
                >
                  {verificationLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={localStyles.buttonText}>
                      Verify & Continue
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ⭐ GLOBAL ALERT */}
      <GlobalAlert />
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    elevation: 6,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: COLORS.text, // ✅ explicit
  },

  label: {
    fontSize: 14,
    color: COLORS.textSecondary, // ✅ explicit
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginVertical: 8,
    backgroundColor: COLORS.surface,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    color: COLORS.text,
  },

  button: {
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "center",
  },

  buttonDisabled: { opacity: 0.6 },

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },

  codeInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
});
