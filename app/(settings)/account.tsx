// /app/(settings)/account.tsx

import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GlobalAlert, { useAlert } from "@/components/GlobalAlert";
import { useToast } from "@/components/Toast/ToastProvider";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import useBackToSettingsRoot from "@/hooks/useBackToSettingsRoot";

export default function AccountScreen() {
  useBackToSettingsRoot();
  
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const toast = useToast();
  const showAlert = useAlert((s) => s.show);

  /* ✅ Fetch real Convex user profile */
  const convexUser = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id ?? "",
  });

  const deleteUserData = useMutation(api.users.deleteUserData);

  /* ------------------------- DELETE CONFIRM ------------------------- */
  const handleDeleteConfirm = async () => {
    try {
      if (!user?.id) {
        toast.show({ type: "error", message: "User not found." });
        return;
      }

      await deleteUserData({ clerkId: user.id });
      await user.delete();
      await signOut();

      toast.show({ type: "success", message: "Account deleted successfully." });
      router.replace("/(auth)/login");
    } catch (error) {
      toast.show({
        type: "error",
        message: "Failed to delete account. Please try again.",
      });
    }
  };

  const handleDelete = () => {
    showAlert({
      title: "Delete Account",
      message:
        "Are you sure you want to delete your account? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: handleDeleteConfirm,
    });
  };

  /* ------------------------- REAL PROFILE IMAGE ------------------------- */
  const imageUri = convexUser?.image
    ? `${convexUser.image}?t=${Date.now()}`
    : user?.imageUrl
      ? `${user.imageUrl}?t=${Date.now()}`
      : "https://i.pravatar.cc/300";

  /* ------------------------- UI ------------------------- */
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      {/* PROFILE CARD */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {convexUser?.fullname || user?.fullName || "User"}
          </Text>
          <Text style={styles.subText}>
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>
      </View>

      {/* OPTIONS */}
      <View style={styles.optionsCard}>
        <Pressable
          style={styles.option}
          onPress={() => router.push("/(settings)/reset-password")}
        >
          <Text style={styles.optionText}>Reset Password</Text>
          <Ionicons name="lock-closed-outline" size={20} color="#444" />
        </Pressable>

        <Pressable
          style={styles.option}
          onPress={() => router.push("/(settings)/account.details")}
        >
          <Text style={styles.optionText}>Account Details</Text>
          <Ionicons name="person-outline" size={20} color="#444" />
        </Pressable>

        <Pressable
          style={[styles.option, { borderBottomWidth: 0 }]}
          onPress={handleDelete}
        >
          <Text style={[styles.optionText, { color: "red" }]}>
            Delete Account
          </Text>
          <Ionicons name="trash-outline" size={20} color="red" />
        </Pressable>
      </View>

      <GlobalAlert />
    </SafeAreaView>
  );
}

/* ------------------------- STYLES ------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  backBtn: { marginRight: 12 },

  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111" },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
  },

  avatarWrapper: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 80,
    padding: 3,
    marginRight: 16,
  },

  avatar: { width: 70, height: 70, borderRadius: 70 },

  name: { fontSize: 20, fontWeight: "700", color: "#111" },

  subText: { fontSize: 14, color: "#777", marginTop: 4 },

  optionsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    elevation: 3,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  optionText: { fontSize: 16, color: "#333" },
});
