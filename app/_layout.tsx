import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
const { Slot }  = require('expo-router');
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import InitalLayout from "@/components/initalLayout";

export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      <SafeAreaProvider>
        <InitalLayout>
          <Slot />
        </InitalLayout>
      </SafeAreaProvider>
    </ClerkAndConvexProvider>
  );
}
