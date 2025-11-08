// Import necessary libraries and components
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
  Image
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/styles/auth.styles";
import { COLORS } from "@/constants/themes";

// Main LoginScreen component
const LoginScreen = () => {
  // Clerk authentication hooks
  const { isLoaded, signIn, setActive } = useSignIn();
  // Navigation hook
  const router = useRouter();

  // State variables for form inputs and UI behavior
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Restrict login to Marwadi University email addresses only
  const isAllowedEmail = (email: string) =>
    email.endsWith("@marwadiuniversity.ac.in");

  // Handles user login logic
  const handleSignIn = async () => {
    // Prevent login before Clerk is initialized
    if (!isLoaded || !signIn) {
      Alert.alert("Please wait", "Authentication is initializing...");
      return;
    }

    // Block non-Marwadi University email addresses
    if (!isAllowedEmail(email)) {
      Alert.alert(
        "Access Denied",
        "Only @marwadiuniversity.ac.in emails can log in."
      );
      return;
    }

    try {
      // Attempt to sign in with Clerk
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      // If sign-in is successful, activate the session and navigate to main tabs
      if (signInAttempt.status === "complete") {
        await setActive?.({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        // Handle any unexpected state
        Alert.alert("Error", "Unexpected sign-in state");
      }
    } catch (err: any) {
      // Show appropriate error message on failure
      Alert.alert(
        "Sign-in failed",
        err.errors ? err.errors[0].message : "Something went wrong"
      );
    }
  };

  // Render the login UI
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
        {/* Brand Header Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            {/* App Logo */}
            <Image
              style = {styles.logoContainer}
              source={require('@/assets/images/education.png')} /> 
          </View>
          {/* App Name and Tagline */}
          <Text style={styles.appName}>CampusConnect</Text>
          <Text style={styles.tagline}>Welcome back!</Text>
        </View>

        {/* Sign-In Card Container */}
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
          {/* Sign-In Header */}
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
            Sign In
          </Text>

          {/* Email Input */}
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

          {/* Password Input with Toggle Visibility */}
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
            {/* Eye Icon to toggle password visibility */}
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color={COLORS.grey}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => router.push("./reset-password")}
            style={{ alignSelf: "flex-end", marginBottom: 8 }}
          >
            <Text style={{ color: COLORS.blue, fontWeight: "500" }}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Sign-In Button */}
          <Pressable
            onPress={handleSignIn}
            style={{
              backgroundColor: COLORS.blue,
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

          {/* Navigation to Signup Page */}
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
              <Text style={{ color: COLORS.blue, fontWeight: "600" }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Export the component for use in navigation
export default LoginScreen;
