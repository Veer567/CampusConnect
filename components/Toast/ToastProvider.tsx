import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Animated, Text, View, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ToastContext = createContext<any>(null);

export const useToast = () => useContext(ToastContext);

const { width } = Dimensions.get("window");

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [toastData, setToastData] = useState<{ title?: string; message?: string }>({});
  const [type, setType] = useState<"success" | "error" | "info">("success");

  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const show = useCallback(
    (
      data: { title?: string; message?: string },
      toastType: "success" | "error" | "info" = "success"
    ) => {
      setToastData(data);
      setType(toastType);
      setVisible(true);

      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 80,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => setVisible(false));
      }, 2500);
    },
    [slideAnim, fadeAnim]
  );

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Ionicons name="checkmark-circle" size={22} color="#fff" />;
      case "error":
        return <Ionicons name="close-circle" size={22} color="#fff" />;
      default:
        return <Ionicons name="information-circle" size={22} color="#fff" />;
    }
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor:
                type === "success"
                  ? "#4CAF50"
                  : type === "error"
                  ? "#FF4F4F"
                  : "#3B82F6",
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.icon}>{getIcon()}</View>

          {/* Text Content */}
          <View style={{ flex: 1 }}>
            {toastData.title && <Text style={styles.title}>{toastData.title}</Text>}
            {toastData.message && (
              <Text style={styles.message}>{toastData.message}</Text>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: 40,
    left: width * 0.07,
    width: width * 0.86,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 999,
    elevation: 10,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  message: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.95,
    marginTop: 2,
  },
});
