import { COLORS } from "@/constants/themes";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  BackHandler,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export default function AccountDetailsScreen() {
  const { user } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/(settings)/account");
      return true;
    });

    return () => sub.remove();
  }, []);
  /* 🔥 FETCH ACTUAL PROFILE FROM CONVEX */
  const convexUser = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id ?? "",
  });

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  /* -----------------------------------------
     AUTO-GENERATE NAME FROM EMAIL
  ----------------------------------------- */
  const autoName = React.useMemo(() => {
    if (!email) return "—";
    const raw = email.split("@")[0];
    const cleaned = raw.replace(/[0-9]/g, "").replace(/[\.\_\-]/g, " ");
    return cleaned
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, [email]);

  const displayName = convexUser?.fullname || user?.fullName || autoName;

  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "--";

  const lastLogin = user?.lastSignInAt
    ? new Date(user.lastSignInAt).toLocaleString()
    : "--";

  /* -----------------------------------------
     🔥 REAL PROFILE IMAGE PRIORITY:
     1. convexUser.image
     2. clerk.imageUrl
     3. fallback avatar
  ----------------------------------------- */
  const imageUri = convexUser?.image
    ? `${convexUser.image}?t=${Date.now()}`
    : user?.imageUrl
      ? `${user.imageUrl}?t=${Date.now()}`
      : "https://i.pravatar.cc/300";

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/(settings)/account")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Account Details</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE IMAGE CARD */}
        <View style={styles.profileImgCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* DETAILS CARD */}
        <View style={styles.card}>
          <DetailItem label="Full Name" value={displayName} />
          <DetailItem label="Email Address" value={email || "—"} />

          <DetailItem label="Joined On" value={createdAt} />
          <DetailItem label="Last Login" value={lastLogin} />
          <DetailItem
            label="Account Status"
            value={user?.primaryEmailAddress?.verification?.status || "Active"}
          />
        </View>
      </ScrollView>
    </View>
  );
}

/* Helper Component */
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

/* Styles */
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

  backBtn: { marginRight: 10 },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
  },

  profileImgCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 20,
    elevation: 4,
  },

  avatarWrapper: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 100,
    padding: 3,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 100,
  },

  name: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },

  email: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 4,
  },

  detailRow: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
});
