import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function Profile() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (err) {
      Alert.alert("Sign out failed", "Please try again.");
      console.error("Sign out error:", err);
    }
  };

  return (
    <SafeAreaView style = {{flex: 1}}>
      <StatusBar style="dark" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: "https://i.pravatar.cc/300" }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editIcon}>
            <Ionicons name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.name}>Alex Johnson</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Year 3</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>alex.johnson@university.edu</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="school-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>Computer Science</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.infoText}>Joined September 2025</Text>
          </View>
          <TouchableOpacity style={styles.linkItem}>
            <Ionicons name="link-outline" size={18} color={COLORS.blue} />
            <Text style={[styles.infoText, { color: COLORS.blue }]}>
              View Resume
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interests */}
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tagsContainer}>
            {["Web Development", "AI/ML", "Competitive Programming"].map(
              (interest, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* Activity Stats */}
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Activity Stats</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>12</Text>
              <Text style={styles.activityLabel}>Posts</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>45</Text>
              <Text style={styles.activityLabel}>Likes</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>8</Text>
              <Text style={styles.activityLabel}>Bookmarks</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.editProfileBtn}>
          <MaterialIcons name="edit" size={18} color="#fff" />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 18,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 24,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  editIcon: {
    position: "absolute",
    right: "40%",
    top: 90,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    elevation: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 12,
  },
  badge: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
    gap: 40,
  },
  stat: { alignItems: "center" },
  statValue: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: "700",
  },
  statLabel: {
    color: COLORS.grey,
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    color: "#333",
    fontSize: 15,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#f3f7ff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  tagText: {
    color: COLORS.secondary,
    fontWeight: "500",
  },
  activityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    width: "30%",
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  activityLabel: {
    color: COLORS.grey,
    fontSize: 14,
  },
  editProfileBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
    marginTop: 24,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editProfileText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  logoutText: {
    textAlign: "center",
    color: "red",
    fontWeight: "600",
    fontSize: 16,
  },
});
