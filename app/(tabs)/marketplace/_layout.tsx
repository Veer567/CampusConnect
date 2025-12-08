// app/(tabs)/marketplace/_layout.tsx
import { Stack } from "expo-router";

export default function MarketplaceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" /> {/* home screen */}
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="create/CreateMarketplace" />
      <Stack.Screen name="create/EditMarketplace" />
    </Stack>
  );
}
