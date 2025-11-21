import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/themes";
import AppHeader from "@/components/AppHeader";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

export default function LikesScreen() {
  const router = useRouter();

  // Raw results may include null
  const rawLikes = useQuery(api.posts.getLikedPosts) ?? [];

  // Filter out null values -> TS-SAFE
  const likes = rawLikes.filter((p) => p !== null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <AppHeader title="Liked Posts" rightIcon="heart" />

      {likes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No liked posts yet</Text>
        </View>
      ) : (
        <FlatList
          data={likes}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                router.push(`/post-details?postId=${item._id}`)
              }
            >
              {/* Thumbnail */}
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, { backgroundColor: "#ccc" }]} />
              )}

              {/* Text Info */}
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>

                {item.eventDate ? (
                  <Text style={styles.meta}>{item.eventDate}</Text>
                ) : null}

                {item.location ? (
                  <Text style={styles.meta}>{item.location}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: wp(5),
    paddingTop: 10,
    paddingBottom: 30,
  },

  emptyContainer: { marginTop: 100, alignItems: "center" },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    alignItems: "center",
    elevation: 2,
  },

  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#eee",
  },

  info: {
    marginLeft: 12,
    flex: 1,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
