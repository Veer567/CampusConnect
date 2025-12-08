import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../../../constants/themes";
import { api } from "../../../../convex/_generated/api";
import PostCard from "../components/PostCard";
import SearchBar from "../components/SearchBar";

export default function HackathonsScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();

  const [search, setSearch] = useState("");

  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const safeUserId = me?._id;

  const screenType: "project" | "hackathon" | "startup" = "hackathon";

  const posts = useQuery(api.marketplace.getMarketplacePosts, {
    type: screenType,
  });

  const startConversation = useMutation(api.chat.getOrStartConversation);
  const deletePost = useMutation(api.marketplace.deleteMarketplacePost);

  /* ------------------------------
     Skeleton Loading (NO hook errors)
  ------------------------------ */
  const isLoading = !posts;

  const filtered = useMemo(() => {
    if (!posts) return [];
    const q = search.toLowerCase();
    if (!q.trim()) return posts;

    return posts.filter((item) => {
      const skills = (item as any).skills;
      const hasSkillMatch =
        Array.isArray(skills) &&
        skills.some((skill: any) => String(skill).toLowerCase().includes(q));

      return (
        item.title?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.tags?.some((s: string) => s.toLowerCase().includes(q)) ||
        hasSkillMatch
      );
    });
  }, [posts, search]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* TOP SEARCH BAR */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Looking for hackathons..."
      />

      {isLoading ? (
        <HackathonSkeleton />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard
              post={{
                ...item,
                interestedUsers: item.interestedUsers?.map((u: any) =>
                  typeof u === "object" && u !== null
                    ? u
                    : { _id: String(u), fullname: "" }
                ),
              }}
              onEdit={(id) =>
                router.push(`/marketplace/create/EditMarketplace?id=${id}`)
              }
              onDelete={async (postId) => {
                await deletePost({ id: postId as any });
              }}
              currentUserId={safeUserId}
              onLearnMore={(post) => {
                if (!post?._id) return;
                router.push({
                  pathname: "/marketplace/post/[id]",
                  params: { id: post._id, from: "hackathon" },
                });
              }}
              interestedAvatars={
                item.interestedUsers
                  ?.map((u: any) => u.image)
                  .filter(Boolean) ?? []
              }
            />
          )}
          ListEmptyComponent={() => (
            <View style={{ padding: 24 }}>
              <Text
                style={{ textAlign: "center", color: COLORS.textSecondary }}
              >
                No hackathons found — try another keyword.
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/marketplace/create/CreateMarketplace?type=${screenType}`
          )
        }
        style={{
          position: "absolute",
          bottom: 70,
          right: 20,
          backgroundColor: COLORS.primary,
          paddingHorizontal: 15,
          paddingVertical: 15,
          borderRadius: 30,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ----------------------------------------------------------
   SKELETON COMPONENT
---------------------------------------------------------- */
function HackathonSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1300,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const Shimmer = () => (
    <Animated.View
      style={[skeletonStyles.shimmer, { transform: [{ translateX }] }]}
    />
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* SEARCH BAR SKELETON */}
      <View style={skeletonStyles.searchBar} />

      {/* 3 skeleton cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={skeletonStyles.card}>
          <View style={skeletonStyles.cardTitle} />
          <View style={skeletonStyles.cardLine} />
          <View style={skeletonStyles.cardLineShort} />
          <View style={skeletonStyles.cardFooter}>
            <View style={skeletonStyles.avatar} />
            <View style={skeletonStyles.avatarLine} />
          </View>

          {/* Shimmer Overlay */}
          <Shimmer />
        </View>
      ))}
    </ScrollView>
  );
}

/* ----------------------------------------------------------
   SKELETON STYLES
---------------------------------------------------------- */
const skeletonStyles = StyleSheet.create({
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: 120,
    backgroundColor: "rgba(255,255,255,0.5)",
    opacity: 0.6,
  },

  searchBar: {
    height: 45,
    borderRadius: 10,
    backgroundColor: "#e4e4e4",
    marginBottom: 18,
  },

  card: {
    backgroundColor: "#f1f1f1",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    overflow: "hidden",
  },

  cardTitle: {
    height: 18,
    width: "60%",
    backgroundColor: "#dcdcdc",
    borderRadius: 6,
    marginBottom: 14,
  },

  cardLine: {
    height: 14,
    width: "100%",
    backgroundColor: "#dbdbdb",
    borderRadius: 6,
    marginBottom: 10,
  },

  cardLineShort: {
    height: 14,
    width: "70%",
    backgroundColor: "#d5d5d5",
    borderRadius: 6,
    marginBottom: 14,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
  },

  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#d0d0d0",
  },

  avatarLine: {
    flex: 1,
    height: 14,
    backgroundColor: "#d3d3d3",
    borderRadius: 6,
  },
});
