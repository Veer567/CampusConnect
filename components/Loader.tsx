// Loader.tsx  
// A simple reusable loading spinner component used to indicate data fetching or waiting states.

import { COLORS } from "@/constants/themes";
import { ActivityIndicator, View } from "react-native";

export function Loader() {
  return (
    // Centered container with consistent background color
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
      }}
    >
      {/* Animated loading spinner */}
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}
