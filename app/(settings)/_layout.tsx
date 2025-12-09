import { useFocusEffect } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { BackHandler } from "react-native";

export default function SettingsLayout() {
  const router = useRouter();

  // Fix Android hardware back button — go back instead of replacing history
  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.back(); // <- use back() so history behaves normally
        return true;
      });

      return () => sub.remove();
    }, [router])
  );

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: "slide_from_right",
      }}
    />
  );
}
