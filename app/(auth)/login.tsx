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
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/styles/auth.styles";
import { COLORS } from "@/constants/themes";

const LoginScreen = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isAllowedEmail = (email: string) =>
    email.endsWith("@marwadiuniversity.ac.in");

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) {
      Alert.alert("Please wait", "Authentication is initializing...");
      return;
    }

    if (!isAllowedEmail(email)) {
      Alert.alert(
        "Access Denied",
        "Only @marwadiuniversity.ac.in emails can log in."
      );
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive?.({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", "Unexpected sign-in state");
      }
    } catch (err: any) {
      Alert.alert(
        "Sign-in failed",
        err.errors ? err.errors[0].message : "Something went wrong"
      );
    }
  };

  const handleForgotPassword = async () => {
    if (!isLoaded || !signIn) {
      Alert.alert("Please wait", "Authentication is initializing...");
      return;
    }

    if (!email) {
      Alert.alert("Missing Email", "Please enter your email address first.");
      return;
    }

    try {
      // Send password reset link
      const resetAttempt = await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      if (resetAttempt.status === "needs_first_factor") {
        Alert.alert(
          "Reset Email Sent",
          "Check your inbox for a password reset code."
        );
        // Optionally, navigate to a Reset Password screen:
        // router.push("/(auth)/reset-password");
      } else {
        Alert.alert("Error", "Unable to send password reset email.");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.errors ? err.errors[0].message : "Something went wrong"
      );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="height">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          backgroundColor: COLORS.background,
        }}
      >
        {/* Brand Header */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="lock-closed" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>CampusConnext</Text>
          <Text style={styles.tagline}>Welcome back!</Text>
        </View>

        {/* Card Container */}
        <View
          style={{
            marginTop: 40,
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
            Sign In
          </Text>

          {/* Email */}
          <Text style={{ color: COLORS.grey }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter your Marwadi email"
            placeholderTextColor="#aaa"
            style={{
              borderWidth: 1,
              borderColor: COLORS.grey + "40",
              borderRadius: 10,
              padding: 12,
              marginVertical: 8,
            }}
          />

          {/* Password */}
          <Text style={{ color: COLORS.grey }}>Password</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: COLORS.grey + "40",
              borderRadius: 10,
              marginVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter password"
              placeholderTextColor="#aaa"
              style={{ flex: 1, paddingVertical: 10 }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color={COLORS.grey}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => router.push("./reset-password")}
            style={{ alignSelf: "flex-end", marginBottom: 8 }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: "500" }}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <Pressable
            onPress={handleSignIn}
            style={{
              backgroundColor: COLORS.primary,
              paddingVertical: 14,
              borderRadius: 12,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                textAlign: "center",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Sign In
            </Text>
          </Pressable>

          {/* Navigate to Signup */}
          <View
            style={{
              marginTop: 20,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.grey }}>Don’t have an account? </Text>
            <TouchableOpacity onPress={() => router.push("./signup")}>
              <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
