import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/themes";

type Props = {
  value?: string;
  onChange?: (text: string) => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChange, placeholder = "Search..." }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={COLORS.grey} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, height: 44, fontSize: 15, color: COLORS.text },
});
