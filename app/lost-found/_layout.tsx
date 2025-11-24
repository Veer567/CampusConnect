// app/lost-found/_layout.tsx
import { Stack } from "expo-router";

export default function LostFoundLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,            // ← enables swipe back
        gestureDirection: "horizontal",  // ← iOS-style back gesture
        presentation: "card",
      }}
    >
      <Stack.Screen name="add" />
    <Stack.Screen name="edit-lost-item" />
    </Stack>
  );
}
