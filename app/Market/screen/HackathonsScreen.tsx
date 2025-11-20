import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../../constants/themes";
import { api } from "../../../convex/_generated/api";
import PostCard from "../components/PostCard";
import SearchBar from "../components/SearchBar";

export default function HackathonsScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const safeUserId = me?._id;
  const posts =
    useQuery(api.marketplace.getMarketplacePosts, { type: "hackathon" }) ?? [];
  const startConversation = useMutation(api.chat.getOrStartConversation);
  const deletePost = useMutation(api.marketplace.deleteMarketplacePost);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SearchBar />

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onEdit={(id) =>
              router.push(`/Market/create/EditMarketplace?id=${id}`)
            }
            onDelete={async (postId) => {
              await deletePost({ id: postId as any });
            }}
            currentUserId={safeUserId} // ✅ ADD THIS LINE
    
            onLearnMore={(post) => {
              if (!post?._id) return;
              router.push({
                pathname: "/Market/post/[id]",
                params: { id: post._id },
              });
            }}
            interestedAvatars={item.interestedUsers?.slice(0, 6).map(String)}
          />
        )}
        ListEmptyComponent={() => (
          <View style={{ padding: 24 }}>
            <Text style={{ textAlign: "center", color: COLORS.textSecondary }}>
              No hackathons yet — create one!
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
      />

      <TouchableOpacity
        onPress={() =>
          router.push("/Market/create/CreateMarketplace?type=hackathon")
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
