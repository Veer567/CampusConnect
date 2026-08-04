import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import useBackToSettingsRoot from "@/hooks/useBackToSettingsRoot";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GlobalAlert, { useAlert } from "@/components/GlobalAlert";
import { COLORS } from "@/constants/themes";

export default function Report() {
  const router = useRouter();
  const report = useMutation(api.settings.reportIssue);
  const showAlert = useAlert((s) => s.show);
  useBackToSettingsRoot();

  const [issue, setIssue] = useState("");

  /* ------------------------- SUBMIT REPORT ------------------------- */
  const submit = async () => {
    if (!issue.trim()) {
      return showAlert({
        title: "Error",
        message: "Please describe the problem.",
        confirmText: "OK",
      });
    }

    await report({ issue });

    showAlert({
      title: "Thank You!",
      message: "Your issue has been reported successfully.",
      confirmText: "OK",
      onConfirm: () => router.back(),
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.text} />
        </Pressable>

        {/* Title */}
        <Text style={styles.title}>Report a Problem</Text>

        {/* Input */}
        <TextInput
          placeholder="Describe the issue..."
          placeholderTextColor={COLORS.grey}
          style={styles.input}
          multiline
          value={issue}
          onChangeText={setIssue}
          selectionColor={COLORS.primary}
          cursorColor={COLORS.primary}
        />

        {/* Submit */}
        <TouchableOpacity style={styles.btn} onPress={submit}>
          <Text style={styles.btnText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Required for alerts */}
      <GlobalAlert />
    </SafeAreaView>
  );
}

/* ------------------------- STYLES ------------------------- */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: COLORS.background,
    flex: 1,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    color: COLORS.text, // ✅ explicit
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 150,
    textAlignVertical: "top",
    backgroundColor: COLORS.surface,
    color: COLORS.text, // ✅ input text color
  },

  btn: {
    marginTop: 20,
    backgroundColor: COLORS.red,
    padding: 14,
    borderRadius: 10,
  },

  btnText: {
    textAlign: "center",
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
