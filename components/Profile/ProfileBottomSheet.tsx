// components/Profile/ProfileBottomSheet.tsx
import React from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Dimensions,
} from "react-native";
import { COLORS } from "@/constants/themes";

export function ProfileBottomSheet({
  visible,
  type,
  input,
  setInput,
  suggestions,
  slideAnim,
  closeSheet,
  addItem,
  handleAddManual,
}: {
  visible: boolean;
  type: "department" | "interest" | "email";
  input: string;
  setInput: (v: string) => void;
  suggestions: string[];
  slideAnim: Animated.Value;
  closeSheet: () => void;
  addItem: (item: string) => void;
  handleAddManual: () => void;
}) {
  const screenHeight = Dimensions.get("window").height;
  const sheetHeight = Math.max(screenHeight * 0.42, 300);

  const title =
    type === "department"
      ? "Select Department"
      : type === "interest"
        ? "Add Interest"
        : "Add Email";

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* BACKDROP */}
      <TouchableWithoutFeedback onPress={closeSheet}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            {/* Prevent backdrop close when interacting */}
            <TouchableWithoutFeedback>
              <Animated.View
                style={{
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                  padding: 18,
                  minHeight: sheetHeight,
                  maxHeight: screenHeight * 0.85,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                {/* HEADER */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: "700" }}>
                    {title}
                  </Text>

                  <TouchableOpacity onPress={closeSheet}>
                    <Text style={{ color: COLORS.grey }}>Close</Text>
                  </TouchableOpacity>
                </View>

                {/* SEARCH INPUT — FOR DEPARTMENT & INTEREST */}
                {type !== "email" && (
                  <TextInput
                    placeholder={`Search ${type}s...`}
                    placeholderTextColor={COLORS.grey}
                    value={input}
                    onChangeText={setInput}
                    style={{
                      borderWidth: 1,
                      borderColor: "#f1f1f1",
                      padding: 12,
                      fontSize: 16,
                      borderRadius: 10,
                      marginTop: 14,
                    }}
                    autoFocus
                  />
                )}

                {/* EMAIL INPUT */}
                {type === "email" && (
                  <TextInput
                    placeholder="Enter email"
                    placeholderTextColor={COLORS.grey}
                    value={input}
                    onChangeText={setInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      borderWidth: 1,
                      borderColor: "#f1f1f1",
                      padding: 12,
                      fontSize: 16,
                      borderRadius: 10,
                      marginTop: 14,
                    }}
                    autoFocus
                  />
                )}

                {/* LIST / SEARCH RESULTS */}
                <ScrollView
                  style={{
                    marginTop: 12,
                    maxHeight: screenHeight * 0.35,
                  }}
                  keyboardShouldPersistTaps="handled"
                >
                  {suggestions.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => addItem(item)}
                      style={{
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: "#efefef",
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{item}</Text>
                    </TouchableOpacity>
                  ))}

                  {/* MANUAL ADD (when no match) */}
                  {suggestions.length === 0 && input.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={handleAddManual}
                      style={{ paddingVertical: 12 }}
                    >
                      <Text style={{ color: COLORS.primary }}>
                        Add “{input}”
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>

                {/* ACTION BUTTONS */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "#eee",
                      paddingVertical: 14,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                    onPress={closeSheet}
                  >
                    <Text style={{ fontWeight: "600", color: "#444" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.primary,
                      paddingVertical: 14,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                    onPress={handleAddManual}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Add
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
