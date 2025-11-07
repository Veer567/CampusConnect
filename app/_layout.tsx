// app/_layout.tsx  (or wherever your root layout lives)
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import InitalLayout from "@/components/initalLayout";
import Toast from "react-native-toast-message";
import { Slot } from "expo-router";

export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      <SafeAreaProvider>
     
        <StatusBar style="dark" translucent={false} backgroundColor="#141313ff" />

        <InitalLayout >
          <Slot />
        </InitalLayout>

        <Toast />
      </SafeAreaProvider>
    </ClerkAndConvexProvider>
  );
}
