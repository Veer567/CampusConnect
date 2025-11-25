// / app/lost-found/_layout.tsx
import { Stack } from "expo-router";

export default function LostFoundLayout() {
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
      <Stack.Screen name="add" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}