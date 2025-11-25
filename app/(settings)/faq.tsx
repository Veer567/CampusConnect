import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function FAQ() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={26} />
      </TouchableOpacity>

      <Text style={styles.title}>Frequently Asked Questions</Text>

      <Text style={styles.q}>1. How do I update my profile?</Text>
      <Text style={styles.a}>Open Profile → Edit Profile → Save.</Text>

      <Text style={styles.q}>2. How do I reset my password?</Text>
      <Text style={styles.a}>
        Use the ‘Forgot Password’ option when logging in.
      </Text>

      <Text style={styles.q}>3. How do I report a user?</Text>
      <Text style={styles.a}>Go to Settings → Report a Problem.</Text>

      <Text style={styles.q}>4. How do I delete my account?</Text>
      <Text style={styles.a}>Settings → Delete Account.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },
  back: { paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: "700", marginTop: 10 },
  q: { marginTop: 25, fontSize: 18, fontWeight: "600" },
  a: { marginTop: 6, fontSize: 15, color: "#555" },
});
