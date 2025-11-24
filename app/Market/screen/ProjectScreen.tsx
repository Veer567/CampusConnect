// app/Market/screens/ProjectsScreen.tsx
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

export default function ProjectsScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const [search, setSearch] = useState("");

  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const safeUserId = me?._id;

  const posts =
    useQuery(api.marketplace.getMarketplacePosts, { type: "project" }) ?? [];
  const deletePost = useMutation(api.marketplace.deleteMarketplacePost);

  const filtered = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter((item: any) => {
      return (
        item.title?.toLowerCase()?.includes(q) ||
        item.location?.toLowerCase()?.includes(q) ||
        item.tags?.some((s: string) => s.toLowerCase().includes(q))
      );
    });
  }, [posts, search]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Looking for projects..."
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const normalizedPost = {
            ...item,
            interestedUsers: item.interestedUsers?.map((u: any) =>
              typeof u === "string" || typeof u === "number"
                ? { _id: String(u), fullname: "", image: undefined }
                : u
            ),
          };

          return (
            <PostCard
              post={normalizedPost}
              currentUserId={safeUserId}
              onEdit={(id) =>
                router.push(`/Market/create/EditMarketplace?id=${id}`)
              }
              onDelete={async (postId) => {
                await deletePost({ id: postId as any });
              }}
              onLearnMore={(post: { _id: any }) =>
                router.push({
                  pathname: "/Market/post/[id]",
                  params: { id: post._id, from: "project" },
                })
              }
              interestedAvatars={
                item.interestedUsers
                  ?.map((u: any) => (u?.image ? u.image : undefined))
                  .filter(Boolean) ?? []
              }
            />
          );
        }}
        ListEmptyComponent={() => (
          <View style={{ padding: 24 }}>
            <Text style={{ textAlign: "center", color: COLORS.textSecondary }}>
              No projects found — try a keyword!
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        onPress={() =>
          router.push("/Market/create/CreateMarketplace?type=project")
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
