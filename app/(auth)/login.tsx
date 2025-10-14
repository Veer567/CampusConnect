import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const LoginScreen = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isAllowedEmail = (email: string) => email.endsWith("@marwadiuniversity.ac.in");

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) {
      Alert.alert("Please wait", "Authentication is initializing...");
      return;
    }

    if (!isAllowedEmail(email)) {
      Alert.alert("Access Denied", "Only @marwadiuniversity.ac.in emails can log in.");
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)"); // redirect to home tabs
      } else {
        Alert.alert("Error", "Unexpected sign-in state");
      }
    } catch (err: any) {
      Alert.alert("Sign-in failed", err.errors ? err.errors[0].message : "Something went wrong");
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 80 }}>
      <Text>Email:</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
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

      <Button title="Sign In" onPress={handleSignIn} />

      {/* Navigate to Signup */}
      <View style={{ marginTop: 20 }}>
        <Button title="Go to Sign Up" onPress={() => router.push("./signup")} />
      </View>
    </View>
  );
};

export default LoginScreen;
