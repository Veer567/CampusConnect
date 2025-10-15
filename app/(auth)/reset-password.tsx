import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPassword() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stage, setStage] = useState<"request" | "reset">("request");

  if (!isLoaded) return null;

  const handlePasswordResetRequest = async () => {
    try {
      await signIn?.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      Alert.alert("Check your email", "A verification code has been sent.");
      setStage("reset");
    } catch (err: any) {
      Alert.alert("Error", err.errors?.[0]?.message || "Something went wrong");
    }
  };

  const handlePasswordReset = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      const result = await signIn?.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result?.status === "complete") {
        Alert.alert("Success", "Password reset successful!");
        router.replace("/(auth)/login"); // Redirect to login screen
      }
    } catch (err: any) {
      Alert.alert("Error", err.errors?.[0]?.message || "Invalid code or password");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      {stage === "request" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.button} onPress={handlePasswordResetRequest}>
            <Text style={styles.buttonText}>Send Reset Code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter code"
            placeholderTextColor="#aaa"
            value={code}
            onChangeText={setCode}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={22}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons
                name={showConfirm ? "eye" : "eye-off"}
                size={22}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
