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

  // Convex user for current Clerk user
  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const safeUserId = me?._id;

  // IMPORTANT: screenType is the single source of truth for this screen
  const screenType: "project" | "hackathon" | "startup" = "hackathon";

  // Load marketplace posts filtered by type
  const posts = useQuery(api.marketplace.getMarketplacePosts, {
    type: screenType,
  }) ?? [];

  const startConversation = useMutation(api.chat.getOrStartConversation);
  const deletePost = useMutation(api.marketplace.deleteMarketplacePost);

  /* -------------------------------------------------------
    🔍 SEARCH LOGIC (Filters title, skills, location, desc)
  --------------------------------------------------------*/
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
       item.tags?.some((s: string) => s.toLowerCase().includes(q))
      );
    });
  }, [posts, search]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>

      {/* 🔍 SEARCH BAR */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Looking for hackathons..."
      />

      {/* LIST */}
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
                params: { id: post._id },
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

      {/* FAB - Create new hackathon */}
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
