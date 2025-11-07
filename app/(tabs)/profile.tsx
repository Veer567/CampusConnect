import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Profile() {
  const { signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions(); // updates on rotate

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor= 'transparent' />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { flexGrow: 1, paddingBottom: insets.bottom + 60 },
          ]}
          showsVerticalScrollIndicator={false}
        >
       
            
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={{ uri: "https://i.pravatar.cc/300" }}
              style={[
                styles.avatar,
                {
                  width: Math.min(width, height) * 0.28, // proportional to the smaller side
                  height: Math.min(width, height) * 0.28,
                  borderRadius: (Math.min(width, height) * 0.28) / 2,
                },
              ]}
              resizeMode="cover"
            />

            <TouchableOpacity
              style={[
                styles.editIcon,
                { right: width * 0.35, top: width * 0.23 },
              ]}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
            </TouchableOpacity>

            <Text
              style={[
                styles.name,
                {
                  fontSize: Math.min(width, height) * 0.055, // proportional to smaller side
                },
              ]}
            >
              Alex Johnson
            </Text>

            <View
              style={[
                styles.badge,
                {
                  paddingHorizontal: Math.min(width, height) * 0.03,
                  paddingVertical: Math.min(width, height) * 0.007,
                  borderRadius: Math.min(width, height) * 0.02,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { fontSize: Math.min(width, height) * 0.035 },
                ]}
              >
                Year 3
              </Text>
            </View>

            <View
              style={[
                styles.statsRow,
                {
                  gap: Math.min(width, height) * 0.1,
                  marginTop: Math.min(width, height) * 0.02,
                },
              ]}
            >
              {[
                { label: "Followers", value: "3" },
                { label: "Following", value: "2" },
              ].map((stat, i) => (
                <View key={i} style={styles.stat}>
                  <Text
                    style={[
                      styles.statValue,
                      { fontSize: Math.min(width, height) * 0.045 },
                    ]}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { fontSize: Math.min(width, height) * 0.032 },
                    ]}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoBox}>
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>alex.johnson@university.edu</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="school-outline"
                size={18}
                color={COLORS.primary}
              />
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
          <View style={{ marginTop: 20 }}>
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
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Activity Stats</Text>
            <View style={styles.activityContainer}>
              {[
                { label: "Posts", value: "12" },
                { label: "Likes", value: "45" },
                { label: "Bookmarks", value: "8" },
              ].map((item, i) => (
                <View key={i} style={styles.activityCard}>
                  <Text style={styles.activityValue}>{item.value}</Text>
                  <Text style={styles.activityLabel}>{item.label}</Text>
                </View>
              ))}
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

          {/* Spacer to ensure bottom visibility */}
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    
  },
  scrollContainer: {
    paddingHorizontal: 18,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  editIcon: {
    position: "absolute",
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    elevation: 4,
  },
  name: {
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 10,
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
    color: COLORS.primary,
    fontWeight: "700",
  },
  statLabel: {
    color: COLORS.grey,
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
    flexShrink: 1,
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
  avatar: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    // width, height, borderRadius are dynamically set based on screen width
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4, // adds soft shadow on Android
  },
});
