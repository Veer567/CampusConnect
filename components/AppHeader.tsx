import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightIcon?: string;
  onBackPress?: () => void;
  onRightPress?: () => void;
}

export default function AppHeader({
  title,
  showBackButton = false,
  rightIcon,
  onBackPress,
  onRightPress,
}: HeaderProps) {
  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={26} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={styles.title}>{title}</Text>

        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
            <Ionicons name={rightIcon as any} size={22} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    height: hp(10), // consistent header height across screens

    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(5),
    marginTop: Platform.OS === "android" ? hp(3) : hp(0.5),
  },
  title: {
    color: COLORS.white,
    fontSize: wp(5),
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: wp(0.5),
  },
  placeholder: {
    width: wp(6),
  },
});
