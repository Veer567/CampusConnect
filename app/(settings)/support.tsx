import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import useBackToSettingsRoot from "@/hooks/useBackToSettingsRoot";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import GlobalAlert, { useAlert } from "@/components/GlobalAlert";
import { useToast } from "@/components/Toast/ToastProvider";

/* ---------------------- EMAIL VALIDATION ---------------------- */
const UNIVERSITY_DOMAIN = "@marwadiuniversity.ac.in";

const isValidEmail = (email: string) => {
  const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (
    basicEmailRegex.test(email) &&
    email.toLowerCase().endsWith(UNIVERSITY_DOMAIN)
  );
};

export default function Support() {
  const router = useRouter();
  const send = useMutation(api.settings.sendSupportMessage);
  const showAlert = useAlert((s) => s.show);
  const toast = useToast();
  useBackToSettingsRoot();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  /* ---------------------- SUBMIT SUPPORT MESSAGE ---------------------- */
  const submit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();

    if (!trimmedEmail || !trimmedMessage) {
      return showAlert({
        title: "Missing Information",
        message: "Please fill out both fields before submitting.",
        confirmText: "OK",
      });
    }

    if (!isValidEmail(trimmedEmail)) {
      return showAlert({
        title: "Invalid Email",
        message: `Please use your official university email ending with ${UNIVERSITY_DOMAIN}`,
        confirmText: "OK",
      });
    }

    try {
      await send({ email: trimmedEmail, message: trimmedMessage });

      showAlert({
        title: "Message Sent",
        message: "Your issue has been successfully submitted to support.",
        confirmText: "OK",
        onConfirm: () => router.back(),
      });
    } catch {
      toast.show({
        type: "error",
        message: "Failed to send message. Please try again.",
      });
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} />
        </Pressable>

        <Text style={styles.title}>Contact Support</Text>

        <Text style={styles.label}>University Email</Text>
        <TextInput
          style={styles.input}
          placeholder={`yourname${UNIVERSITY_DOMAIN}`}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your issue..."
          multiline
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity style={styles.btn} onPress={submit}>
          <Text style={styles.btnText}>Send Message</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ⭐ Required for confirmation modals */}
      <GlobalAlert />
    </>
  );
}

/* ---------------------- STYLES ---------------------- */

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },

  title: { fontSize: 26, fontWeight: "700", marginBottom: 25 },

  label: { fontSize: 15, marginTop: 10 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
  },

  textArea: { height: 140, textAlignVertical: "top" },

  btn: {
    marginTop: 30,
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
  },

  btnText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
});
