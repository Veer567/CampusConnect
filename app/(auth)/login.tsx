// LoginScreen.tsx
import React, { useState, useRef } from "react";
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
  Animated,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
  const passwordRef = useRef<TextInput>(null);


  // shimmer animation
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
        await setActive?.({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        Alert.alert("Sign-in", "Sign-in not completed. Please try again.");
      }
    } catch (err: any) {
      const message =
        (err?.errors && err.errors[0]?.message) ||
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 25}
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
               onSubmitEditing={() => passwordRef.current?.focus()}
              textContentType="username"
            />

            <Text style={localStyles.label}>Password</Text>
            <View style={localStyles.passwordRow}>
              <TextInput
                ref={passwordRef}   // ← ADD REF
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter password"
                placeholderTextColor="#9AA0A6"
                style={localStyles.passwordInput}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                textContentType="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((s) => !s)}
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
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

            {/* ⬇️ SIGN IN BUTTON WITH SHIMMER ANIMATION */}
            <Pressable
              onPress={handleSignIn}
              onPressIn={startShimmer}
              onPressOut={stopShimmer}
              style={[
                localStyles.signInButton,
                loading ? localStyles.buttonDisabled : null,
              ]}
              disabled={loading}
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={localStyles.signInText}>Sign In</Text>
                )}
              </Animated.View>
            </Pressable>
            {/* ⬆️ END SHIMMER BUTTON */}

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
  logoImage: { width: "100%", height: "100%" },
  appName: {
    fontSize: isSmallPhone ? 20 : 26,
    fontWeight: "700",
    color: COLORS.text ?? "#111",
  },
  tagline: { fontSize: 14, color: COLORS.grey, marginTop: 4 },
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
  signInText: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  signupRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  greyText: { color: COLORS.grey },
  signupLink: { color: COLORS.blue, fontWeight: "600" },
});
