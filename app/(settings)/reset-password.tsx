import { COLORS } from "@/constants/themes";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { BackHandler } from "react-native";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GlobalAlert, { useAlert } from "@/components/GlobalAlert";
import { useToast } from "@/components/Toast/ToastProvider";

export default function ChangePasswordScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const showAlert = useAlert((s) => s.show);
  const toast = useToast();

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const newPassRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  /* ------------------------- HANDLE PASSWORD CHANGE ------------------------- */
  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      return showAlert({
        title: "Missing Fields",
        message: "Please fill in all password fields.",
        confirmText: "OK",
      });
    }

    if (newPass !== confirmPass) {
      return showAlert({
        title: "Mismatch",
        message: "New passwords do not match.",
      });
    }

    if (newPass.length < 6) {
      return showAlert({
        title: "Weak Password",
        message: "Password must be at least 6 characters long.",
      });
    }

    try {
      setLoading(true);

      await user?.updatePassword({
        currentPassword: currentPass,
        newPassword: newPass,
      });

      showAlert({
        title: "Password Updated",
        message: "Please log in again to continue.",
        confirmText: "Log In",
        onConfirm: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      });
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || "Failed to change password.";
      showAlert({
        title: "Error",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/(settings)/account");
      return true;
    });

    return () => sub.remove();
  }, []);

  /* ------------------------- UI ------------------------- */
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background, marginTop: -1 }}
      edges={[]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
        </View>

        {/* CONTENT */}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            {/* CURRENT PASSWORD */}
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                secureTextEntry={!showCurrent}
                value={currentPass}
                onChangeText={setCurrentPass}
                placeholder="Enter current password"
                style={styles.passwordInput}
                returnKeyType="next"
                onSubmitEditing={() => newPassRef.current?.focus()}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons
                  name={showCurrent ? "eye-off" : "eye"}
                  size={22}
                  color="#777"
                />
              </TouchableOpacity>
            </View>

            {/* NEW PASSWORD */}
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={newPassRef}
                secureTextEntry={!showNew}
                value={newPass}
                onChangeText={setNewPass}
                placeholder="Enter new password"
                style={styles.passwordInput}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons
                  name={showNew ? "eye-off" : "eye"}
                  size={22}
                  color="#777"
                />
              </TouchableOpacity>
            </View>

            {/* CONFIRM NEW PASSWORD */}
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={confirmRef}
                secureTextEntry={!showConfirm}
                value={confirmPass}
                onChangeText={setConfirmPass}
                placeholder="Confirm new password"
                style={styles.passwordInput}
                returnKeyType="done"
                onSubmitEditing={handleChangePassword}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons
                  name={showConfirm ? "eye-off" : "eye"}
                  size={22}
                  color="#777"
                />
              </TouchableOpacity>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* 🌟 GLOBAL ALERT */}
        <GlobalAlert />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------------- STYLES ------------------------- */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", marginLeft: 12 },
  content: { padding: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 3,
  },
  label: { marginBottom: 6, color: "#555", fontWeight: "600" },

  passwordRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: 15 },

  button: {
    backgroundColor: COLORS.blue,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
