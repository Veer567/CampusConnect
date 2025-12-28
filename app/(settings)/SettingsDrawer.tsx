import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import React, { useEffect } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/themes";

export default function SettingsDrawer() {
  const router = useRouter();
  const { signOut } = useAuth();

  type IconName = ComponentProps<typeof Ionicons>["name"];

  const items: { label: string; icon: IconName; route: string }[] = [
    {
      label: "Account",
      icon: "person-circle-outline",
      route: "/(settings)/account",
    },
    {
      label: "FAQ",
      icon: "help-circle-outline",
      route: "/(settings)/faq",
    },
    {
      label: "Support",
      icon: "headset-outline",
      route: "/(settings)/support",
    },
    {
      label: "Report Issue",
      icon: "alert-circle-outline",
      route: "/(settings)/report",
    },
    {
      label: "Terms & Conditions",
      icon: "document-text-outline",
      route: "/(settings)/terms",
    },
    {
      label: "Privacy Policy",
      icon: "shield-checkmark-outline",
      route: "/(settings)/privacy",
    },
    {
      label: "About Us",
      icon: "people-outline",
      route: "/(settings)/about",
    },
  ];

  // Android back button → return to Profile
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/(tabs)/profile");
      return true;
    });

    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={[]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Settings</Text>

        {/* Settings Card */}
        <View style={styles.card}>
          {items.map((item, idx) => (
            <Pressable
              key={idx}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
                idx === items.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Ionicons name={item.icon} size={22} color={COLORS.text} />

              <Text style={styles.label}>{item.label}</Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.grey}
                style={styles.chev}
              />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          style={styles.logoutBtn}
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
    backgroundColor: COLORS.background,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
    color: COLORS.text, // ✅ correct text color
  },

  card: {
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  itemPressed: {
    backgroundColor: COLORS.surfaceLight,
  },

  label: {
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text, // ✅ explicit
  },

  chev: {
    marginLeft: "auto",
  },

  logoutBtn: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFECEC",
    padding: 16,
    borderRadius: 10,
  },

  logoutText: {
    marginLeft: 10,
    color: COLORS.red,
    fontSize: 17,
    fontWeight: "600",
  },
});
