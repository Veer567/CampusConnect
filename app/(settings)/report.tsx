import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function Report() {
  const router = useRouter();
  const report = useMutation(api.settings.reportIssue);

  const [issue, setIssue] = useState("");

  const submit = async () => {
    if (!issue) return Alert.alert("Error", "Please describe the problem.");

    await report({ issue });

    Alert.alert("Done", "Your issue has been reported.");
    router.back();
  };

  return (
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
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },
  back: { paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  textBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    minHeight: 150,
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
    input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    minHeight: 150,
    textAlignVertical: "top",
  },
  
});
