// components/profile/ProfileBottomSheet.tsx
import { Animated, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { COLORS } from "@/constants/themes";

export function ProfileBottomSheet({
  visible, type, input, setInput, suggestions, slideAnim, closeSheet, addItem, handleAddManual
}: any) {
  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={closeSheet}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
            <Animated.View style={{ backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, minHeight: 220, transform: [{ translateY }] }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700" }}>
                  {type === "department" ? "Add Department" : type === "interest" ? "Add Interest" : "Add Email"}
                </Text>
                <TouchableOpacity onPress={closeSheet}><Text style={{ color: "#888" }}>Close</Text></TouchableOpacity>
              </View>

              <TextInput
                placeholder={type === "email" ? "Enter email local part" : `Search ${type}s...`}
                value={input}
                onChangeText={setInput}
                style={{ borderWidth: 1, borderColor: "#f1f1f1", padding: 10, borderRadius: 8, marginTop: 10, fontSize: 16 }}
                autoFocus
              />

              <ScrollView style={{ maxHeight: 220, marginTop: 8 }}>
                {suggestions.length === 0 && input.trim().length > 0 && (
                  <TouchableOpacity onPress={handleAddManual} style={{ padding: 10 }}>
                    <Text style={{ color: COLORS.primary }}>Add "{input}"</Text>
                  </TouchableOpacity>
                )}
                {suggestions.map((s: string, i: number) => (
                  <TouchableOpacity key={i} onPress={() => addItem(s)} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f1f1" }}>
                    <Text style={{ color: "#333" }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                <TouchableOpacity onPress={closeSheet} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: "#eee", alignItems: "center", marginRight: 8 }}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddManual} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: "center" }}>
                  <Text style={{ color: "#fff" }}>Add</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}