import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import useBackToSettingsRoot from "@/hooks/useBackToSettingsRoot";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

import GlobalAlert, { useAlert } from "@/components/GlobalAlert";

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
    <>
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} />
        </TouchableOpacity>

        <Text style={styles.title}>Report a Problem</Text>

        <TextInput
          placeholder="Describe the issue..."
          style={styles.input}
          multiline
          value={issue}
          onChangeText={setIssue}
        />

        <TouchableOpacity style={styles.btn} onPress={submit}>
          <Text style={styles.btnText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ⭐ GlobalAlert must be mounted */}
      <GlobalAlert />
    </>
  );
}

/* ------------------------- STYLES ------------------------- */

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },

  back: { paddingBottom: 10 },

  title: { fontSize: 26, fontWeight: "700", marginBottom: 20 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    minHeight: 150,
    textAlignVertical: "top",
  },

  btn: {
    marginTop: 20,
    backgroundColor: "#FF3B30",
    padding: 14,
    borderRadius: 10,
  },

  btnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
