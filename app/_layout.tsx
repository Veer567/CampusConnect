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
        {/* -------------------------------------------------
            1. StatusBar – NOT translucent on iOS
            2. Valid hex colour (or use `transparent` + view)
           ------------------------------------------------- */}
        <StatusBar style="dark" translucent={false} backgroundColor="#141313ff" />

        {/* -------------------------------------------------
            2. InitalLayout must fill the screen
           ------------------------------------------------- */}
        <InitalLayout >
          <Slot />
        </InitalLayout>

        {/* -------------------------------------------------
            3. Toast **inside** SafeAreaProvider → proper insets
           ------------------------------------------------- */}
        <Toast />
      </SafeAreaProvider>
    </ClerkAndConvexProvider>
  );
}
