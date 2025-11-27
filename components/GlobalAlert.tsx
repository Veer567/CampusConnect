import { create } from "zustand";
import { Modal, View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { COLORS } from "@/constants/themes";

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  show: (title: string, message: string) => void;
  hide: () => void;
}

export const useAlert = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: "",
  show: (title: string, message: string) => set({ visible: true, title, message }),
  hide: () => set({ visible: false }),
}));

export default function GlobalAlert() {
  const { visible, title, message, hide } = useAlert();

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
    } else {
      fade.setValue(0);
      scale.setValue(0.8);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          opacity: fade,
        }}
      >
        <Animated.View
          style={{
            width: "80%",
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 20,
            alignItems: "center",
            transform: [{ scale }],
          }}
        >
          <Ionicons name="alert-circle" size={40} color={COLORS.primary} />

          <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 10 }}>
            {title}
          </Text>

          <Text
            style={{
              textAlign: "center",
              color: "#555",
              marginTop: 10,
              marginBottom: 20,
            }}
          >
            {message}
          </Text>

          <TouchableOpacity
            onPress={hide}
            style={{
              backgroundColor: COLORS.primary,
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              OK
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
