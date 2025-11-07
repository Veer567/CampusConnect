import React from "react";
import { View, Platform, StatusBar as RNStatusBar, ColorValue } from "react-native";
import { StatusBar, StatusBarStyle } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  style?: StatusBarStyle;
};


export default function CustomStatusBar({
  colors = ["#3B82F6", "#0EA5E9"],
  style = "light",
}: Props) {
  const statusBarHeight =
    Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 44; // approximate for iOS notch

  return (
    <View style={{ height: statusBarHeight }}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <StatusBar translucent backgroundColor="transparent" style={style} />
      </LinearGradient>
    </View>
  );
}
