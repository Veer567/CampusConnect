// app/Market/screens/StartupsScreen.tsx

import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ScrollView,
  Animated,
} from "react-native";
import { COLORS } from "../../../constants/themes";
import { api } from "../../../convex/_generated/api";
import PostCard from "../components/PostCard";
import SearchBar from "../components/SearchBar";

export default function StartupsScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();

  const [search, setSearch] = useState("");

  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const safeUserId = me?._id;

  const posts = useQuery(api.marketplace.getMarketplacePosts, {
    type: "startup",
  });

  const deletePost = useMutation(api.marketplace.deleteMarketplacePost);
  const isLoading = !posts;

  const filtered = useMemo(() => {
    if (!posts) return [];
    const q = search.toLowerCase();
    if (!q.trim()) return posts;

    return posts.filter((item: any) => {
      return (
        item.title?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.tags?.some((s: string) => s.toLowerCase().includes(q))
      );
    });
  }, [posts, search]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Looking for startups..."
      />

      {isLoading ? (
        <MarketSkeleton />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard
              post={{
                ...item,
                interestedUsers:
                  (item.interestedUsers?.filter((u: any) => u != null) as any) ??
                  [],
              } as any}
              currentUserId={safeUserId}
              onEdit={(id) =>
                router.push(`/Market/create/EditMarketplace?id=${id}`)
              }
              onDelete={async (postId) => {
                await deletePost({ id: postId as any });
              }}
              onLearnMore={(post) =>
                router.push({
                  pathname: "/Market/post/[id]",
                  params: { id: post._id, from: "startup" },
                })
              }
              interestedAvatars={
                item.interestedUsers?.map((u: any) => u.image).filter(Boolean) ??
                []
              }
            />
          )}
          ListEmptyComponent={() => (
            <View style={{ padding: 24 }}>
              <Text style={{ textAlign: "center", color: COLORS.textSecondary }}>
                No startups found — try a keyword!
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        onPress={() =>
          router.push("/Market/create/CreateMarketplace?type=startup")
        }
        style={styles.fab}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* Reuse same skeleton as Projects */
function MarketSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const Shimmer = () => (
    <Animated.View
      style={[sk.shimmer, { transform: [{ translateX: translate }] }]}
    />
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={sk.searchBar} />

      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={sk.card}>
          <View style={sk.title} />
          <View style={sk.line} />
          <View style={sk.lineShort} />
          <View style={sk.footer}>
            <View style={sk.avatar} />
            <View style={sk.info} />
          </View>
          <Shimmer />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 70,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 6,
  },
});

/* Skeleton Styles (Shared) */
const sk = StyleSheet.create({
  shimmer: {
    position: "absolute",
    width: 120,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.5)",
    opacity: 0.6,
    top: 0,
    left: 0,
  },
  searchBar: {
    height: 45,
    backgroundColor: "#e4e4e4",
    borderRadius: 10,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#efefef",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    overflow: "hidden",
  },
  title: {
    height: 18,
    width: "60%",
    backgroundColor: "#dadada",
    borderRadius: 6,
    marginBottom: 12,
  },
  line: {
    height: 14,
    backgroundColor: "#d6d6d6",
    borderRadius: 6,
    marginBottom: 10,
    width: "100%",
  },
  lineShort: {
    height: 14,
    backgroundColor: "#d9d9d9",
    borderRadius: 6,
    marginBottom: 14,
    width: "70%",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#d0d0d0",
  },
  info: {
    height: 14,
    flex: 1,
    backgroundColor: "#d3d3d3",
    borderRadius: 6,
  },
});
