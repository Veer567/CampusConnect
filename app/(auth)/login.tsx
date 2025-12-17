// LoginScreen.tsx
import GlobalAlert, { useAlert } from "@/components/GlobalAlert";
import { COLORS } from "@/constants/themes";
import { useSignIn } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* Responsive helpers */
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallPhone = SCREEN_WIDTH < 360;

const LoginScreen: React.FC = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const showAlert = useAlert((s) => s.show);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  /* Shimmer animation */
  const shimmer = useRef(new Animated.Value(0)).current;

  const startShimmer = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopShimmer = () => {
    shimmer.stopAnimation();
    shimmer.setValue(0);
  };

  /* Only allow Marwadi University emails */
  const isAllowedEmail = (raw: string) =>
    raw.trim().toLowerCase().endsWith("@marwadiuniversity.ac.in");

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) {
      showAlert({
        title: "Please wait",
        message: "Authentication is initializing…",
        confirmText: "OK",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isAllowedEmail(normalizedEmail)) {
      showAlert({
        title: "Access Denied",
        message: "Only @marwadiuniversity.ac.in emails can log in.",
        confirmText: "OK",
      });
      return;
    }

    if (!password) {
      showAlert({
        title: "Missing Password",
        message: "Please enter your password.",
        confirmText: "OK",
      });
      return;
    }

    try {
      setLoading(true);

      const signInAttempt = await signIn.create({
        identifier: normalizedEmail,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive?.({
          session: signInAttempt.createdSessionId,
        });
        router.replace("/(tabs)");
      } else {
        showAlert({
          title: "Sign-in Failed",
          message: "Sign-in not completed. Please try again.",
          confirmText: "OK",
        });
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.message ||
        err?.message ||
        "Something went wrong. Please try again.";

      showAlert({
        title: "Sign-in Failed",
        message,
        confirmText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 25}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Brand */}
          <View style={styles.brandSection}>
            <Image
              source={require("@/assets/images/education.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>CampusConnect</Text>
            <Text style={styles.tagline}>Welcome back!</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter your Marwadi email"
              placeholderTextColor={COLORS.grey}
              style={styles.input}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter password"
                placeholderTextColor={COLORS.grey}
                style={styles.passwordInput}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color={COLORS.grey}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("./reset-password")}
              style={styles.forgot}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Pressable
              onPress={handleSignIn}
              onPressIn={startShimmer}
              onPressOut={stopShimmer}
              disabled={loading}
              style={[styles.signInButton, loading && styles.buttonDisabled]}
            >
              <Animated.View
                style={{
                  opacity: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.4],
                  }),
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signInText}>Sign In</Text>
                )}
              </Animated.View>
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.greyText}>Don’t have an account? </Text>
              <TouchableOpacity onPress={() => router.push("./signup")}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ⭐ GLOBAL ALERT */}
      <GlobalAlert />
    </SafeAreaView>
  );
};

export default LoginScreen;

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: isSmallPhone ? 18 : 28,
  },
  brandSection: { alignItems: "center", marginBottom: 12 },
  logoImage: { width: 100, height: 100 },
  appName: { fontSize: 26, fontWeight: "700" },
  tagline: { fontSize: 14, color: COLORS.grey, marginTop: 4 },
  card: {
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
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
  passwordInput: { flex: 1, paddingVertical: 10 },
  forgot: { alignSelf: "flex-end", marginBottom: 8 },
  forgotText: { color: COLORS.blue },
  signInButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  signInText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  signupRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  greyText: { color: COLORS.grey },
  signupLink: { color: COLORS.blue, fontWeight: "600" },
});
