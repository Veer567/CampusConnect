import { create } from "zustand";
import { Modal, View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { COLORS } from "@/constants/themes";

/* ----------------------------------------------------
   ALERT STORE (ZUSTAND) — Supports Confirm & Cancel
---------------------------------------------------- */
interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;

  show: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => void;

  hide: () => void;
}

export const useAlert = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: "",
  confirmText: "OK",
  cancelText: undefined,
  onConfirm: undefined,
  onCancel: undefined,

  show: ({ title, message, confirmText, cancelText, onConfirm, onCancel }) =>
    set({
      visible: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
    }),

  hide: () =>
    set({
      visible: false,
      onConfirm: undefined,
      onCancel: undefined,
    }),
}));

/* ----------------------------------------------------
   GLOBAL ALERT COMPONENT (UPGRADED)
---------------------------------------------------- */
export default function GlobalAlert() {
  const { visible, title, message, confirmText, cancelText, hide, onConfirm, onCancel } =
    useAlert();

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  /* ANIMATION */
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      fade.setValue(0);
      scale.setValue(0.8);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
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
          {/* ICON */}
          <Ionicons name="alert-circle" size={48} color={COLORS.primary} />

          {/* TITLE */}
          <Text style={{ fontSize: 20, fontWeight: "700", marginTop: 10 }}>
            {title}
          </Text>

          {/* MESSAGE */}
          <Text
            style={{
              textAlign: "center",
              color: "#555",
              marginTop: 10,
              marginBottom: 20,
              fontSize: 15,
            }}
          >
            {message}
          </Text>

          {/* BUTTONS */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* CANCEL BUTTON (optional) */}
            {cancelText && (
              <TouchableOpacity
                onPress={() => {
                  onCancel?.();
                  hide();
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#E5E7EB",
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginRight: 10,
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: "#333",
                    fontWeight: "700",
                  }}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            {/* CONFIRM BUTTON */}
            <TouchableOpacity
              onPress={() => {
                onConfirm?.();
                hide();
              }}
              style={{
                flex: 1,
                backgroundColor: COLORS.primary,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "#fff",
                  fontWeight: "700",
                }}
              >
                {confirmText ?? "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
