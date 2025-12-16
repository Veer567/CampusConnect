// app/(tabs)/profile/likes.tsx
import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;
const params = useLocalSearchParams();
const from = Array.isArray(params.from) ? params.from[0] : params.from;
export default function LikesScreen() {
  const router = useRouter();

  // Fetch liked posts (reactive)
  const rawLikes = useQuery(api.posts.getLikedPosts) ?? [];

  // Toggle like/unlike (same mutation you already have)
  const toggleLikePost = useMutation(api.posts.toggleLikePost);

  // Filter nulls safely
  const likes = useMemo(() => rawLikes.filter((p) => p !== null), [rawLikes]);

  // When user toggles like here we call the same mutation — likes table will update,
  // and ActivityStatsCard will reflect it because it re-reads likes from DB reactively.
  const handleUnlike = async (postId: Id<"posts">) => {
    try {
      await toggleLikePost({ postId });
    } catch (err) {
      console.log("Unlike error:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <AppHeader
        title="Liked Posts"
        rightIcon="heart"
        showBackButton={true}
        onBackPress={() =>
          from === "profile" ? router.back() : router.push("/profile")
        }
      />

      {likes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No liked posts yet</Text>
        </View>
      ) : (
        <FlatList
          data={likes}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Open post details and pass where we came from */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/post-details",
                    params: {
                      postId: item._id,
                      from: "likes",
                    },
                  })
                }
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: "#ccc" }]} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.info}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/post-details",
                    params: { postId: item._id, from: "likes" },
                  })
                }
              >
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>

                {item.eventDate && (
                  <Text style={styles.meta}>{item.eventDate}</Text>
                )}
                {item.location && (
                  <Text style={styles.meta}>{item.location}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleUnlike(item._id)}
                style={styles.unlikeBtn}
              >
                <Ionicons name="heart" size={24} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  emptyBox: { marginTop: hp(15), alignItems: "center" },
  emptyText: { fontSize: wp(4), color: COLORS.textSecondary },

  listContent: { paddingHorizontal: wp(5), paddingBottom: hp(3) },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: wp(3),
    padding: wp(3),
    marginBottom: hp(1.8),
    alignItems: "center",
    elevation: Platform.OS === "android" ? 3 : 0,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 3 },
  },

  thumb: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(3),
    backgroundColor: "#eee",
  },

  info: { flex: 1, marginLeft: wp(4) },

  title: {
    fontSize: wp(4),
    fontWeight: "700",
    color: COLORS.text,
  },

  meta: {
    marginTop: wp(1),
    fontSize: wp(3.3),
    color: COLORS.textSecondary,
  },

  unlikeBtn: { padding: wp(2) },
});
