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
}: any) {
  const screenHeight = Dimensions.get("window").height;

  // Responsive height → 40% of screen OR 300px minimum
  const sheetHeight = Math.max(screenHeight * 0.42, 300);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight, 0],
  });

  const title =
    type === "department"
      ? "Add Department"
      : type === "interest"
      ? "Add Interest"
      : "Add Email";

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* DARK BACKDROP */}
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
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  {
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    padding: 18,
                    minHeight: sheetHeight,
                    maxHeight: screenHeight * 0.85,
                    transform: [{ translateY }],
                  },
                ]}
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

                {/* INPUT */}
                <TextInput
                  placeholder={
                    type === "email"
                      ? "Enter email local part"
                      : `Search ${type}s...`
                  }
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

                {/* SUGGESTIONS */}
                <ScrollView
                  style={{ marginTop: 12, maxHeight: screenHeight * 0.35 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {suggestions.length === 0 && input.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={handleAddManual}
                      style={{ paddingVertical: 12 }}
                    >
                      <Text style={{ color: COLORS.primary }}>
                        Add "{input}"
                      </Text>
                    </TouchableOpacity>
                  )}

                  {suggestions.map((s: string, i: number) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => addItem(s)}
                      style={{
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#efefef",
                      }}
                    >
                      <Text style={{ fontSize: 15 }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* ACTION BUTTONS */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 16,
                    gap: 12,
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
