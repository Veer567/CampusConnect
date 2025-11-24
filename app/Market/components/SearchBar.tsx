import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/themes";

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

type Props = {
  value?: string;
  onChange?: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
};

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  onSubmit,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons
        name="search"
        size={20}
        color={COLORS.grey}
        style={styles.icon}
      />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

/* --------------------------------------------
   FULLY RESPONSIVE & PLATFORM-SAFE STYLES
--------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: wp(4),
    marginTop: wp(3),
    marginBottom: wp(2),
    borderWidth: 1,
    borderColor: COLORS.border,

    // ANDROID SHADOW
    elevation: 3,

    // iOS SHADOW
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },

  icon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    height: Platform.OS === "ios" ? 42 : 44,
    fontSize: 15,
    color: COLORS.text,
  },
});
