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

export default function About() {
  const router = useRouter();

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
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
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

      {/* SECTION: Developers */}
      <View style={[styles.sectionBox, { marginBottom: 50 }]}>
        <Text style={styles.heading}>Project Team</Text>

        {/* Viral */}
        <Pressable
          style={styles.devRow}
          onPress={() =>
            openLink(
              "https://www.linkedin.com/in/viral-bhojani-5a5650328?utm_source=share_via&utm_content=profile&utm_medium=member_android"
            )
          }
        >
          <Text style={styles.devName}>• Viral Bhojani</Text>
          <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
        </Pressable>

        {/* Vikas */}
        <Pressable
          style={styles.devRow}
          onPress={() =>
            openLink("https://www.linkedin.com/in/vikas-singh-android")
          }
        >
          <Text style={styles.devName}>• Vikas Singh</Text>
          <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
        </Pressable>

        {/* Aryan */}
        <Pressable
          style={styles.devRow}
          onPress={() =>
            openLink(
              "https://www.linkedin.com/in/aryan-bhojani-62360936b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
            )
          }
        >
          <Text style={styles.devName}>• Aryan Bhojani</Text>
          <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
        </Pressable>
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
