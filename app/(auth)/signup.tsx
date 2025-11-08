// Import core dependencies and UI components
import { COLORS } from "@/constants/themes";
import { styles } from "@/styles/auth.styles";
import { useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// Main component for user registration
export default function SignupScreen() {
  // Clerk authentication hook
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false); // Controls UI between sign-up and verification
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Restrict users to institutional email domain
  const isAllowedEmail = (email: string) =>
    email.endsWith("@marwadiuniversity.ac.in");

  // Handles user registration
  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;

    // Validate institutional email
    if (!isAllowedEmail(email)) {
      Alert.alert(
        "Access Denied",
        "Only @marwadiuniversity.ac.in emails are allowed."
      );
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      // Create a new user in Clerk
      await signUp.create({ emailAddress: email, password });
      // Trigger email verification code
      await signUp.prepareEmailAddressVerification();
      setIsCodeSent(true);
      Alert.alert(
        "Verify your email",
        "A verification code has been sent to your Marwadi University inbox."
      );
    } catch (err: any) {
      // Display relevant error message if sign-up fails
      Alert.alert(
        "Sign-up failed",
        err.errors ? err.errors[0].message : "Something went wrong"
      );
    }
  };

  // Handles email verification process
  const handleVerifyCode = async () => {
    if (!signUp) return;

    if (!code) {
      Alert.alert("Enter Code", "Please enter the verification code.");
      return;
    }

    try {
      // Verify code entered by user
      const result = await signUp.attemptEmailAddressVerification({ code });
      // On success, activate session and navigate to main app
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        Alert.alert("Verification failed", "Invalid or expired code.");
      }
    } catch (err: any) {
      // Handle invalid or expired verification codes
      Alert.alert(
        "Verification failed",
        err.errors ? err.errors[0].message : "Something went wrong"
      );
    }
  };

  // UI rendering section
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
        {/* App branding section */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
             <Image
                style = {styles.logoContainer}
                source={require('@/assets/images/education.png')} /> 
          </View>
          <Text style={styles.appName}>CampusConnect</Text>
          <Text style={styles.tagline}>Lets Connect</Text>
        </View>

        {/* Sign-up / Verification form container */}
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
          {/* Conditional rendering between Sign Up and Verification steps */}
          {!isCodeSent ? (
            <>
              {/* Sign-up section */}
              <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
                Create Account
              </Text>

              {/* Email field */}
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

              {/* Password field with visibility toggle */}
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

              {/* Confirm password field with visibility toggle */}
              <Text style={{ color: COLORS.grey }}>Confirm Password</Text>
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
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor="#aaa"
                  style={{ flex: 1, paddingVertical: 10 }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={22}
                    color={COLORS.grey}
                  />
                </TouchableOpacity>
              </View>

              {/* Sign-up button */}
              <Pressable
                onPress={handleSignUp}
                style={{
                  backgroundColor: COLORS.blue,
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginTop: 16,
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
                  Sign Up
                </Text>
              </Pressable>
            </>
          ) : (
            /* Verification code input section */
            <>
              <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
                Verify Your Email
              </Text>
              <Text style={{ color: COLORS.grey, marginBottom: 8 }}>
                Enter the 6-digit code sent to your email:
              </Text>

              {/* Code input field */}
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                placeholder="Enter verification code"
                placeholderTextColor="#aaa"
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.grey + "40",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                  textAlign: "center",
                  fontSize: 16,
                  letterSpacing: 2,
                }}
              />

              {/* Verify code button */}
              <Pressable
                onPress={handleVerifyCode}
                style={{
                  backgroundColor: COLORS.blue,
                  paddingVertical: 14,
                  borderRadius: 12,
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
                  Verify & Continue
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
