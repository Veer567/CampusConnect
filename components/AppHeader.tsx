// AppHeader.tsx
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

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightIcon?: string;
  onBackPress?: () => void;
  onRightPress?: () => void;
  alignLeft?: boolean; // ✅ new prop
}

export default function AppHeader({
  title,
  showBackButton = false,
  rightIcon,
  onBackPress,
  onRightPress,
  alignLeft = false, // default = false, so old screens stay same
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

        {/* ✅ Title alignment controlled by prop */}
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
        marginLeft: wp(-7.5), // ✅ moves closer to left edge
        fontFamily: "Poppins_700Bold",
        fontSize: wp(6.2),
        letterSpacing: 0.3,
    },
  ]}
>
  {title}
</Text>

        </View>

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
    height: hp(6.5),
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
    marginTop: Platform.OS === "android" ? hp(1) : hp(0.5),
  },
  titleContainer: {
    flex: 1,
    alignItems: "center", // default center
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
