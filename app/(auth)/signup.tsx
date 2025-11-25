// SignupScreen.tsx
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,

  Platform,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/themes";
import { styles as authStyles } from "@/styles/auth.styles";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const passRef = useRef<TextInput | null>(null);
  const confirmPassRef = useRef<TextInput | null>(null);
  const codeRef = useRef<TextInput | null>(null);

  // Allow only Marwadi emails
  const isAllowedEmail = (e: string) =>
    e.trim().toLowerCase().endsWith("@marwadiuniversity.ac.in");

  // SIGN UP
  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;

    const normalized = email.trim().toLowerCase();

    if (!isAllowedEmail(normalized)) {
      Alert.alert(
        "Access Denied",
        "Only @marwadiuniversity.ac.in emails are allowed."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
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

      setTimeout(() => codeRef.current?.focus(), 400);

      Alert.alert(
        "Email Verification",
        "A verification code has been sent to your inbox."
      );
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.message || err.message || "Something went wrong";
      Alert.alert("Sign-up failed", msg);
    } finally {
      setLoading(false);
    }
  };

  // VERIFY
  const handleVerifyCode = async () => {
    if (!signUp || !code.trim()) {
      Alert.alert("Missing Code", "Please enter the 6-digit code.");
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
        Alert.alert("Verification failed", "Invalid verification code.");
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.message || err.message || "Invalid or expired code.";
      Alert.alert("Verification failed", msg);
    } finally {
      setVerificationLoading(false);
    }
  };

  const horizontalPadding = width > 420 ? 40 : 24;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
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
          {/* Branding */}
          <View style={authStyles.brandSection}>
            <View style={authStyles.logoContainer}>
              <Image
                style={authStyles.logoContainer}
                resizeMode="contain"
                source={require("@/assets/images/education.png")}
              />
            </View>
            <Text style={authStyles.appName}>CampusConnect</Text>
            <Text style={authStyles.tagline}>Let's Connect</Text>
          </View>

          {/* Card */}
          <View style={localStyles.card}>
            {!isCodeSent ? (
              <>
                <Text style={localStyles.title}>Create Account</Text>

                {/* Email */}
                <Text style={localStyles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="Enter your Marwadi email"
                  placeholderTextColor="#999"
                  style={localStyles.input}
                  returnKeyType="next"
                  onSubmitEditing={() => passRef.current?.focus()}
                />

                {/* Password */}
                <Text style={localStyles.label}>Password</Text>
                <View style={localStyles.passwordRow}>
                  <TextInput
                    ref={passRef}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter password"
                    placeholderTextColor="#aaa"
                    style={localStyles.passwordInput}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPassRef.current?.focus()}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((p) => !p)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color={COLORS.grey}
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <Text style={localStyles.label}>Confirm Password</Text>
                <View style={localStyles.passwordRow}>
                  <TextInput
                    ref={confirmPassRef}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor="#aaa"
                    style={localStyles.passwordInput}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((p) => !p)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={22}
                      color={COLORS.grey}
                    />
                  </TouchableOpacity>
                </View>

                {/* Sign Up Button */}
                <Pressable
                  onPress={handleSignUp}
                  style={[
                    localStyles.button,
                    loading && localStyles.buttonDisabled,
                  ]}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={localStyles.buttonText}>Sign Up</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={localStyles.title}>Verify Email</Text>
                <Text style={{ color: COLORS.grey, marginBottom: 8 }}>
                  Enter the 6-digit code sent to your Marwadi email:
                </Text>

                <TextInput
                  ref={codeRef}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  placeholder="Enter code"
                  placeholderTextColor="#aaa"
                  maxLength={6}
                  style={localStyles.codeInput}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyCode}
                />

                <Pressable
                  onPress={handleVerifyCode}
                  style={[
                    localStyles.button,
                    verificationLoading && localStyles.buttonDisabled,
                  ]}
                  disabled={verificationLoading}
                >
                  {verificationLoading ? (
                    <ActivityIndicator color="white" />
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
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 14, color: COLORS.grey },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grey + "40",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grey + "40",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
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
    borderColor: COLORS.grey + "40",
    borderRadius: 10,
    padding: 12,
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: 20,
  },
});
