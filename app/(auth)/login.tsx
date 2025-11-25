// LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles as externalStyles } from "@/styles/auth.styles";
import { COLORS } from "@/constants/themes";
import { SafeAreaView } from "react-native-safe-area-context";

// local responsive helpers
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallPhone = SCREEN_WIDTH < 360;

const LoginScreen: React.FC = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // only allow Marwadi University emails (trim + lowercase)
  const isAllowedEmail = (rawEmail: string) =>
    rawEmail.trim().toLowerCase().endsWith("@marwadiuniversity.ac.in");

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) {
      Alert.alert("Please wait", "Authentication is initializing...");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isAllowedEmail(normalizedEmail)) {
      Alert.alert(
        "Access Denied",
        "Only @marwadiuniversity.ac.in emails can log in."
      );
      return;
    }

    if (!password) {
      Alert.alert("Missing password", "Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const signInAttempt = await signIn.create({
        identifier: normalizedEmail,
        password,
      });

      if (signInAttempt.status === "complete") {
        // activate session (optional chaining in case setActive is undefined)
        await setActive?.({ session: signInAttempt.createdSessionId });
        // navigate to main tabs (replace)
        router.replace("/(tabs)");
      } else {
        // handle intermediate states: show friendly message
        Alert.alert("Sign-in", "Sign-in not completed. Please try again.");
      }
    } catch (err: any) {
      // try to show Clerk errors when available, otherwise fallback
      const message =
        (err && err.errors && err.errors[0] && err.errors[0].message) ||
        err?.message ||
        "Something went wrong. Please try again.";
      Alert.alert("Sign-in failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={localStyles.safeArea}>
      <KeyboardAvoidingView
        style={localStyles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={localStyles.scrollContainer}
        >
          {/* Brand Header */}
          <View style={localStyles.brandSection}>
            <View style={localStyles.logoWrapper}>
              <Image
                source={require("@/assets/images/education.png")}
                style={localStyles.logoImage}
                resizeMode="contain"
                accessible
                accessibilityLabel="CampusConnect logo"
              />
            </View>
            <Text style={localStyles.appName}>CampusConnect</Text>
            <Text style={localStyles.tagline}>Welcome back!</Text>
          </View>

          {/* Card */}
          <View style={localStyles.card}>
            <Text style={localStyles.cardTitle}>Sign In</Text>

            <Text style={localStyles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(t) => setEmail(t)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="Enter your Marwadi email"
              placeholderTextColor="#9AA0A6"
              style={localStyles.input}
              returnKeyType="next"
              onSubmitEditing={() => {
                // focus password — simple approach: no ref used to keep code short
              }}
              accessible
              accessibilityLabel="Email input"
              textContentType="username"
            />

            <Text style={localStyles.label}>Password</Text>
            <View style={localStyles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter password"
                placeholderTextColor="#9AA0A6"
                style={localStyles.passwordInput}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={() => {
                  // submit on pressing Done
                  handleSignIn();
                }}
                accessible
                accessibilityLabel="Password input"
                textContentType="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((s) => !s)}
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color={COLORS.grey}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("./reset-password")}
              style={localStyles.forgot}
            >
              <Text style={localStyles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Pressable
              onPress={handleSignIn}
              style={[
                localStyles.signInButton,
                loading ? localStyles.buttonDisabled : null,
              ]}
              disabled={loading}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={localStyles.signInText}>Sign In</Text>
              )}
            </Pressable>

            <View style={localStyles.signupRow}>
              <Text style={localStyles.greyText}>Don’t have an account? </Text>
              <TouchableOpacity onPress={() => router.push("./signup")}>
                <Text style={localStyles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

/* Local styles (kept separate and responsive) */
const localStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: isSmallPhone ? 18 : 28,
    backgroundColor: COLORS.background,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 12,
  },
  logoWrapper: {
    width: isSmallPhone ? 84 : 110,
    height: isSmallPhone ? 84 : 110,
    borderRadius: isSmallPhone ? 12 : 16,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: isSmallPhone ? 20 : 26,
    fontWeight: "700",
    color: COLORS.text ?? "#111",
  },
  tagline: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 4,
  },
  card: {
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  label: { color: COLORS.grey, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grey + "40",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
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
  forgot: { alignSelf: "flex-end", marginBottom: 8 },
  forgotText: { color: COLORS.blue, fontWeight: "500" },
  signInButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  signInText: { color: COLORS.white, textAlign: "center", fontSize: 16, fontWeight: "600" },
  signupRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  greyText: { color: COLORS.grey },
  signupLink: { color: COLORS.blue, fontWeight: "600" },
});
