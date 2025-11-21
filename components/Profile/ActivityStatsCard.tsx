import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/themes";

export function ActivityStatsCard({
  stats,
}: {
  stats?: { likes?: number; bookmarks?: number };
}) {
  const router = useRouter();

  const likes = stats?.likes ?? 0;
  const bookmarks = stats?.bookmarks ?? 0;

  const navItems: { label: string; value: number; route: "/likes" | "/bookmarks" }[] = [
    { label: "Likes", value: likes, route: "/likes" },
    { label: "Bookmarks", value: bookmarks, route: "/bookmarks" },
  ];

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.heading}>Activity Stats</Text>

      <View style={styles.row}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={{ width: "31%" }}
            onPress={() =>
              router.push({
                pathname: item.route, // FIXED: No more unmatched route
              })
            }
          >
            <View style={styles.card}>
              <Text style={styles.value}>{item.value}</Text>
              <Text style={styles.label}>{item.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    width: "100%",
  },
  value: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  label: {
    color: COLORS.grey,
    fontSize: 13,
  },
});
