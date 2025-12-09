import { useFocusEffect } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import React from "react";
import { BackHandler } from "react-native";

export default function SettingsLayout() {
  const router = useRouter();
  const segments = useSegments();

  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        const current = segments[segments.length - 1];

        // Inside subpages → go back to SettingsDrawer
        if (
          current === "account" ||
          current === "faq" ||
          current === "privacy" ||
          current === "report"
        ) {
          router.replace("/(settings)/SettingsDrawer");
          return true;
        }

        // On drawer root → go to profile tab
        if (current === "(settings)") {
          router.replace("/(tabs)/profile");
          return true;
        }

        return false;
      });

      return () => sub.remove();
    }, [segments, router])
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
