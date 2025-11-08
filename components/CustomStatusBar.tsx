// CustomStatusBar.tsx  
// A gradient status bar component that adapts to both Android and iOS,  
// ensuring visual consistency with a smooth gradient background.

import React from "react";
import { View, Platform, StatusBar as RNStatusBar, ColorValue } from "react-native";
import { StatusBar, StatusBarStyle } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

// Props definition for customizing colors and status bar style
type Props = {
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]]; // gradient colors
  style?: StatusBarStyle; // light or dark bar content
};

// Main CustomStatusBar component
export default function CustomStatusBar({
  colors = ["#3B82F6", "#0EA5E9"], // default blue gradient
  style = "light", // light text/icons by default
}: Props) {
  // Get status bar height depending on platform
  const statusBarHeight =
    Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 44; // approx for iOS notch area

  return (
    // Wrapper view to match native status bar height
    <View style={{ height: statusBarHeight }}>
      {/* Gradient background behind the translucent status bar */}
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Transparent Expo StatusBar overlay with custom style */}
        <StatusBar translucent backgroundColor="transparent" style={style} />
      </LinearGradient>
    </View>
  );
}
