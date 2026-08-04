// CustomStatusBar.tsx  
// A gradient status bar component that adapts to both Android and iOS,  
// ensuring visual consistency with a smooth gradient background on all devices including foldables and tablets.

import { LinearGradient } from "expo-linear-gradient";
import { StatusBar, StatusBarStyle } from "expo-status-bar";
import React from "react";
import { ColorValue, Platform, StatusBar as RNStatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  // Get safe area insets to properly handle foldables, tablets, and notched devices
  const insets = useSafeAreaInsets();
  
  // Use safe area top inset for accurate status bar height across all devices
  const statusBarHeight = insets.top > 0 
    ? insets.top 
    : Platform.OS === "android" 
      ? RNStatusBar.currentHeight ?? 0 
      : 44; // fallback for iOS without notch

  return (
    // Wrapper view positioned absolutely to overlay content without pushing layout down
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: statusBarHeight,
        zIndex: 999,
      }}
    >
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
