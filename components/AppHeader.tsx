// AppHeader.tsx  
// A reusable header component with gradient background, optional back/right icons,  
// and flexible title alignment for different screen contexts.
// Optimized for foldables, tablets, and all screen sizes.

import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Get screen dimensions for responsive layout
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

// Define props for customization
interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightIcon?: string;
  onBackPress?: () => void;   // <── CUSTOM BACK HANDLER
  onRightPress?: () => void;
  alignLeft?: boolean;        // enables left-aligned title
}

// Main AppHeader component
export default function AppHeader({
  title,
  showBackButton = true,
  rightIcon,
  onBackPress,
  onRightPress,
  alignLeft = false,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Default back behavior if user did not pass custom handler
  const handleBack = () => {
    if (onBackPress) onBackPress();
    else router.back();
  };

  // Calculate minimum header content height (base height without safe area)
  const baseHeaderHeight = Math.max(hp(6.5), 50);

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.header, 
        { 
          paddingTop: insets.top, // Add safe area padding at top
          minHeight: baseHeaderHeight + insets.top, // Ensure minimum height including safe area
        }
      ]}
    >
      <View style={styles.headerContent}>
        
        {/* LEFT: Back button */}
        {showBackButton ? (
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={26} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        {/* CENTER / LEFT TITLE */}
        <View
          style={[
            styles.titleContainer,
            alignLeft && { alignItems: "flex-start", flex: 1 },
          ]}
        >
          <Text
            style={[
              styles.title,
              alignLeft && {
                textAlign: "left",
                alignSelf: "flex-start",
                marginLeft: wp(-7.5),
                fontFamily: "Poppins_700Bold",
                fontSize: wp(6.2),
                letterSpacing: 0.3,
              },
            ]}
          >
            {title}
          </Text>
        </View>

        {/* RIGHT ICON */}
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

// Styles
const styles = StyleSheet.create({
  header: {
    width: "100%",
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
    flex: 1,
    minHeight: 50, // Minimum height for header content
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
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
