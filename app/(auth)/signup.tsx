import { useSignUp } from "@clerk/clerk-expo";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function SignupScreen() {
  const { isLoaded, signUp, setActive } = useSignUp(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isAllowedEmail = (email: string) => email.endsWith("@marwadiuniversity.ac.in");

  const handleSignUp = async () => {
    // 🚨 Prevent undefined access
    if (!isLoaded || !signUp) {
      Alert.alert("Loading", "Please wait, authentication is still initializing.");
      return;
    }

    if (!isAllowedEmail(email)) {
      Alert.alert("Access Denied", "Only @marwadiuniversity.ac.in emails are allowed.");
      return;
    }

    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification();
      Alert.alert("Verify your email", "Please check your Marwadi University inbox.");
    } catch (err: any) {
      Alert.alert("Sign-up failed", err.errors ? err.errors[0].message : "Something went wrong");
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 80 }}>
      <Text>Email:</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
      />
      <Text>Password:</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
      />
      <Button title="Sign Up" onPress={handleSignUp} />
    </View>
  );
}
