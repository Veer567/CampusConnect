import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import useBackToSettingsRoot from "@/hooks/useBackToSettingsRoot";

export default function About() {
  const router = useRouter();
  useBackToSettingsRoot();

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.log("Failed to open URL:", err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
     
      <Pressable
        style={styles.backBtn}
        onPress={() => {
          // prefer going back; if user landed here directly and back() does nothing,
          // you can still navigate to settings as a fallback.
          try {
            router.back();
          } catch {
            router.replace("/(settings)/SettingsDrawer");
          }
        }}
      >
        <Ionicons name="arrow-back" size={26} color="#222" />
      </Pressable>
      {/* Title */}
      <Text style={styles.title}>About Us</Text>
      {/* SECTION: About Project */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>What is CampusConnect?</Text>
        <Text style={styles.text}>
          CampusConnect is a unified student platform designed to help students
          connect, collaborate, and stay updated. Whether it’s posting updates,
          joining student projects, discovering opportunities, or managing lost
          and found items — CampusConnect brings everything into one place.
        </Text>
      </View>
      {/* SECTION: Mission */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>Our Mission</Text>
        <Text style={styles.text}>
          Our mission is to build a more connected, informed, and collaborative
          campus environment by providing powerful digital tools that improve
          communication and student productivity.
        </Text>
      </View>
      {/* SECTION: Features */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>Key Features</Text>

        <View style={styles.list}>
          <Text style={styles.point}>• Social feed & updates</Text>
          <Text style={styles.point}>
            • Marketplace for projects & hackathons
          </Text>
          <Text style={styles.point}>• Lost & Found management</Text>
          <Text style={styles.point}>• Real-time chat & group messaging</Text>
          <Text style={styles.point}>• Notifications & alerts</Text>
          <Text style={styles.point}>
            • Student profiles & content visibility
          </Text>
        </View>
      </View>
      {/* SECTION: Why */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>Why We Built This</Text>
        <Text style={styles.text}>
          Important campus information is often scattered across groups,
          messages, posters, and stories. CampusConnect centralizes everything —
          making student life organized, simple, and efficient.
        </Text>
      </View>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#222",
    marginBottom: 16,
  },

  sectionBox: {
    marginBottom: 22,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },

  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },

  text: {
    fontSize: 15.5,
    color: "#555",
    lineHeight: 22,
  },

  list: { marginTop: 4 },
  point: {
    fontSize: 15.5,
    color: "#444",
    marginBottom: 6,
  },

  devTextBox: {
    flex: 1,
  },

  devName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },

  devRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
});
