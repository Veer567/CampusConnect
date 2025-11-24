// app/Market/screens/HackathonsScreen.tsx
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../../constants/themes";
import { api } from "../../../convex/_generated/api";
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
  const posts =
    useQuery(api.marketplace.getMarketplacePosts, { type: screenType }) ?? [];

  const startConversation = useMutation(api.chat.getOrStartConversation);
  const deletePost = useMutation(api.marketplace.deleteMarketplacePost);

  const filtered = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
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
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Looking for hackathons..."
      />

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
              router.push(`/Market/create/EditMarketplace?id=${id}`)
            }
            onDelete={async (postId) => {
              await deletePost({ id: postId as any });
            }}
            currentUserId={safeUserId}
            onLearnMore={(post) => {
              if (!post?._id) return;
              router.push({
                pathname: "/Market/post/[id]",
                params: { id: post._id, from: "hackathon" },
              });
            }}
            interestedAvatars={
              item.interestedUsers?.map((u: any) => u.image).filter(Boolean) ??
              []
            }
          />
        )}
        ListEmptyComponent={() => (
          <View style={{ padding: 24 }}>
            <Text style={{ textAlign: "center", color: COLORS.textSecondary }}>
              No hackathons found — try another keyword.
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
      />

      <TouchableOpacity
        onPress={() =>
          router.push(`/Market/create/CreateMarketplace?type=${screenType}`)
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
