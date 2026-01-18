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
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/themes";

/* ------------------------------------------------
   Helper
------------------------------------------------ */
const openLink = (url: string) => {
  Linking.openURL(url);
};

export default function AboutDevelopers() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={COLORS.text} />
        </Pressable>

        <Text style={styles.title}>About Developers</Text>
        <Text style={styles.subtitle}>
          Meet the people behind CampusConnect 🚀
        </Text>

        {/* PROJECT TEAM */}
        <View style={styles.sectionBox}>
          <Text style={styles.heading}>Project Team</Text>

          {/* Viral */}
          <Pressable
            style={styles.devRow}
            onPress={() =>
              openLink("https://www.linkedin.com/in/viral-bhojani-5a5650328")
            }
          >
            <Text style={styles.devName}>• Viral Bhojani</Text>
            <Ionicons name="logo-linkedin" size={22} color="#0077B5" />
          </Pressable>

          {/* Vikas */}
          <Pressable
            style={styles.devRow}
            onPress={() =>
              openLink("https://www.linkedin.com/in/vikas-singh-android")
            }
          >
            <Text style={styles.devName}>• Vikas Singh</Text>
            <Ionicons name="logo-linkedin" size={22} color="#0077B5" />
          </Pressable>

          {/* Aryan */}
          <Pressable
            style={styles.devRow}
            onPress={() =>
              openLink("https://www.linkedin.com/in/aryan-bhojani-62360936b")
            }
          >
            <Text style={styles.devName}>• Aryan Bhojani</Text>
            <Ionicons name="logo-linkedin" size={22} color="#0077B5" />
          </Pressable>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>Built with ❤️ at Marwadi University</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------
   STYLES
------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
  },

  backBtn: {
    marginBottom: 10,
    width: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },

  sectionBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  heading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: COLORS.text,
  },

  devRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  devName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },

  footer: {
    marginTop: 40,
    textAlign: "center",
    color: COLORS.grey,
    fontSize: 14,
  },
});
