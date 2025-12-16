// app/components/ActivityStatsCard.tsx
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export function ActivityStatsCard() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { stats } = useProfile();

  const likes = stats?.likes ?? 0;
  const bookmarks = stats?.bookmarks ?? 0;

  const navItems = [
    { label: "Likes", value: likes, route: "/likes" as const },
    { label: "Bookmarks", value: bookmarks, route: "/bookmarks" as const },
  ];

  const cardWidth = (width - 60) / 2;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Activity Stats</Text>

      <View style={styles.row}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.card, { width: cardWidth }]}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: item.route,
                params: { from: "profile" },
              })
            }
          >
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  heading: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  value: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  label: {
    color: COLORS.grey,
    fontSize: 14,
    fontWeight: "500",
  },
});