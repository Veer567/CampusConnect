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





export default function SignupScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isAllowedEmail = (email: string) =>
    email.endsWith("@marwadiuniversity.ac.in");

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;

    if (!isAllowedEmail(email)) {
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

    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification();
      setIsCodeSent(true);
      Alert.alert(
        "Verify your email",
        "A verification code has been sent to your Marwadi University inbox."
      );
    } catch (err: any) {
      Alert.alert(
        "Sign-up failed",
        err.errors ? err.errors[0].message : "Something went wrong"
      );
    }
  };

  const handleVerifyCode = async () => {
    if (!signUp) return;

    if (!code) {
      Alert.alert("Enter Code", "Please enter the verification code.");
      return;
    }

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        Alert.alert("Verification failed", "Invalid or expired code.");
      }
    } catch (err: any) {
      Alert.alert(
        "Verification failed",
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
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
             <Image
                style = {styles.logoContainer}
                source={require('@/assets/images/education.png')} /> 
          </View>
          <Text style={styles.appName}>CampusConnect</Text>
          <Text style={styles.tagline}>Lets Connect</Text>
        </View>

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
          {!isCodeSent ? (
            <>
              <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
                Create Account
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

              {/* Confirm Password */}
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

              {/* Sign Up Button */}
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
            <>
              <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
                Verify Your Email
              </Text>
              <Text style={{ color: COLORS.grey, marginBottom: 8 }}>
                Enter the 6-digit code sent to your email:
              </Text>

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
