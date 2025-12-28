// ActivityStatsCard.tsx
import { COLORS } from "@/constants/themes";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

/* ---------------- TYPES ---------------- */

type ActivityStats = {
  likes: number;
  bookmarks: number;
};

interface Props {
  stats?: ActivityStats | null;
}

/* ---------------- COMPONENT ---------------- */

export function ActivityStatsCard({ stats }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const likes = stats?.likes ?? 0;
  const bookmarks = stats?.bookmarks ?? 0;

  const cardWidth = (width - 60) / 2;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Activity Stats</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, { width: cardWidth }]}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "/likes",
              params: { from: "profile" },
            })
          }
        >
          <Text style={styles.value}>{likes}</Text>
          <Text style={styles.label}>Likes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { width: cardWidth }]}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "/bookmarks",
              params: { from: "profile" },
            })
          }
        >
          <Text style={styles.value}>{bookmarks}</Text>
          <Text style={styles.label}>Bookmarks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  heading: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
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
