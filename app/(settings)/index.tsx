import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsHome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() =>  router.navigate("(settings)/SettingsDrawer" as any)}
      >
        <Ionicons name="settings-outline" size={22} color="#555" />
        <Text style={styles.text}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  button: { flexDirection: "row", alignItems: "center", padding: 14 },
  text: { marginLeft: 10, fontSize: 16 },
});
