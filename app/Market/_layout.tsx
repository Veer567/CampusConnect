// app/Market/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function MarketLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        presentation: "card",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="create/EditMarketplace" />
      <Stack.Screen name="create/CreateMarketplace" />
    </Stack>
  );
}
