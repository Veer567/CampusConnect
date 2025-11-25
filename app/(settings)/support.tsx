import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function Support() {
  const router = useRouter();
  const send = useMutation(api.settings.sendSupportMessage);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!email || !message) return Alert.alert("Missing info", "Please fill all fields");

    await send({ email, message });

    Alert.alert("Success", "Your message was sent");
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={26} />
      </TouchableOpacity>

      <Text style={styles.title}>Contact Support</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="example@gmail.com"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe your issue"
        multiline
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>Send Message</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },
  back: { paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 25 },
  label: { fontSize: 15, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  textArea: { height: 140 },
  btn: {
    marginTop: 30,
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
  },
  btnText: { textAlign: "center", color: "#fff", fontSize: 16, fontWeight: "700" },
});
