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

export default function StartScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();

  const [search, setSearch] = useState("");

  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const safeUserId = me?._id;

  const posts =
    useQuery(api.marketplace.getMarketplacePosts, { type: "startup" }) ?? [];

  const deletePost = useMutation(api.marketplace.deleteMarketplacePost);

  /* 🔍 SEARCH FILTER LOGIC */
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
        placeholder="Looking for startups..."
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
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
                params: { id: post._id },
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

      <TouchableOpacity
        onPress={() =>
          router.push("/Market/create/CreateMarketplace?type=startup")
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
