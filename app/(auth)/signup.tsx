import { useSignUp } from "@clerk/clerk-expo";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
      Alert.alert("Access Denied", "Only @marwadiuniversity.ac.in emails are allowed.");
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
    <View style={{ padding: 20, marginTop: 80 }}>
      {!isCodeSent ? (
        <>
          <Text>Email:</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType= "email-address"
            autoCapitalize="none"
            style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
          />

          <Text>Password:</Text>
          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, marginVertical: 10, padding: 8 }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={{ flex: 1 }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} />
            </TouchableOpacity>
          </View>

          <Text>Confirm Password:</Text>
          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, marginVertical: 10, padding: 8 }}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              style={{ flex: 1 }}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} />
            </TouchableOpacity>
          </View>

          <Button title="Sign Up" onPress={handleSignUp} />
        </>
      ) : (
        <>
          <Text>Enter Verification Code:</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
          />
          <Button title="Verify & Continue" onPress={handleVerifyCode} />
        </>
      )}
    </View>
  );
}
