import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";

const ResetPasswordScreen = () => {
  const { isLoaded, signIn } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");

  // Step 1: Request password reset code
  const handleRequestReset = async () => {
    if (!isLoaded || !signIn) {
      Alert.alert("Please wait", "Authentication is initializing...");
      return;
    }

    if (!email) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      Alert.alert("Email Sent", "Check your inbox for a password reset code.");
      setStep("verify");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.errors ? err.errors[0].message : "Something went wrong"
      );
    }
  };

  // Step 2: Verify code and set new password
  const handleResetPassword = async () => {
    if (!isLoaded || !signIn) return;

    if (!code || !newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete") {
        Alert.alert("Success", "Password has been reset successfully!");
        router.replace("/(auth)/login"); // Redirect to login after reset
      } else {
        Alert.alert("Error", "Unexpected state during password reset.");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.errors ? err.errors[0].message : "Invalid code or password."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          backgroundColor: COLORS.background,
        }}
      >
        <View
          style={{
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
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              marginBottom: 20,
              textAlign: "center",
              color: COLORS.primary,
            }}
          >
            Reset Password
          </Text>

          {step === "request" ? (
            <>
              <Text style={{ color: COLORS.grey }}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter your email"
                placeholderTextColor="#aaa"
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.grey + "40",
                  borderRadius: 10,
                  padding: 12,
                  marginVertical: 10,
                }}
              />

              <TouchableOpacity
                onPress={handleRequestReset}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginTop: 10,
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
                  Send Reset Code
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ color: COLORS.grey }}>Verification Code</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                placeholder="Enter code from email"
                placeholderTextColor="#aaa"
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.grey + "40",
                  borderRadius: 10,
                  padding: 12,
                  marginVertical: 10,
                }}
              />

              {/* New Password */}
              <Text style={{ color: COLORS.grey }}>New Password</Text>
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
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#aaa"
                  style={{ flex: 1, paddingVertical: 10 }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
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
                  placeholder="Confirm new password"
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

              <TouchableOpacity
                onPress={handleResetPassword}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginTop: 10,
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
                  Reset Password
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 20 }}
          >
            <Text
              style={{
                color: COLORS.primary,
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPasswordScreen;
