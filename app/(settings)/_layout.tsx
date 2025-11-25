// app/(settings)/_layout.tsx

import { Stack, useRouter } from "expo-router";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";

export default function SettingsLayout() {
  const router = useRouter();

  // Fix Android hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace("/(tabs)/profile"); // ⇦ your profile path
        return true;
      });

      return () => sub.remove();
    }, [])
  );

  // Fix iOS gesture back
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        router.replace("/(tabs)/profile"); // ⇦ your profile path
      };
    }, [])
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
