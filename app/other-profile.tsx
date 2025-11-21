// app/(tabs)/other-profile.tsx

import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileContent } from "@/components/Profile/ProfileContent";
import { ProfileHeader } from "@/components/Profile/ProfileHeader";
import { Id } from "@/convex/_generated/dataModel";
import { useProfileImageCache } from "@/hooks/useProfileImageCache";

export default function OtherUserProfile() {
  const router = useRouter();

  // URL PARAM
  const { userId } = useLocalSearchParams();
  const uid = userId as Id<"users">;

  // Clerk Auth
  const { userId: myClerkId } = useAuth();

  // Fetch MY Convex User
  const me = useQuery(api.users.getUserByClerkId, {
    clerkId: myClerkId || "",
  });

  // Fetch OTHER user profile
  const user = useQuery(api.users.getUserProfile, { id: uid });
  const userPosts = useQuery(api.posts.getPostsByUser, { userId: uid });
  const isFollowing = useQuery(api.users.isFollowing, { followingId: uid });

  // Mutations
  const toggleFollow = useMutation(api.users.toggleFollow);
  const getOrStartConv = useMutation(api.chat.getOrStartConversation);

  const imageCacheBuster = useProfileImageCache(userId as string);

  if (!user || !me) {
    return (
      <SafeAreaView style={styles.loadingBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", marginLeft: 10 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {/* PROFILE HEADER */}
        <ProfileHeader
          imageUrl={user.image}
          fullname={user.fullname}
          year={user.year || ""}
          editing={false}
          isOwner={false}
          setFullname={() => {}}
          setYear={() => {}}
          openImageCropper={() => {}}
          imageCacheBuster={imageCacheBuster}
          followers={user.followers}
          following={user.following}
          posts={user.posts}
          userId={user._id}
        />

        {/* FOLLOW BUTTON */}
        <TouchableOpacity
          style={isFollowing ? styles.followingBtn : styles.followBtn}
          onPress={() => toggleFollow({ followingId: user._id })}
        >
          <Text style={isFollowing ? styles.followingText : styles.followText}>
            {isFollowing ? "Following ✔" : "Follow"}
          </Text>
        </TouchableOpacity>

        {/* MESSAGE BUTTON */}
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={async () => {
            try {
              const conv = await getOrStartConv({
                otherUserId: user._id,
              });

              const conversationId =
                typeof conv === "object" && conv && "_id" in conv
                  ? conv._id
                  : conv;

              // Pass *Convex IDs* not Clerk ID
              router.push(
                `/chat-screen?conversationId=${conversationId}&currentUserId=${me._id}&otherUserId=${user._id}`
              );
            } catch (err) {
              console.error("Start conversation error:", err);
            }
          }}
        >
          <Text style={styles.messageText}>Message 💬</Text>
        </TouchableOpacity>

        {/* PROFILE CONTENT */}
        <ProfileContent
          emails={user.emails || []}
          departments={user.departments || []}
          interests={user.interests || []}
          resumeUrl={user.resumeUrl}
          editing={false}
          setEmails={() => {}}
          openSheet={() => {}}
          removeEmail={() => {}}
          removeDepartment={() => {}}
          removeInterest={() => {}}
          pickResume={() => {}}
        />

        {/* POSTS TITLE */}
        <Text style={styles.postsTitle}>Posts</Text>

        {/* POSTS GRID */}
        <View style={styles.postsGrid}>
          {userPosts?.length ? (
            userPosts.map((p) => (
              <TouchableOpacity
                key={p._id}
                onPress={() =>
                  router.push({
                    pathname: "/post-details",
                    params: { postId: p._id },
                  })
                }
              >
                <Image source={{ uri: p.imageUrl }} style={styles.postImage} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noPostsBox}>
              <Ionicons
                name="image-outline"
                size={45}
                color={COLORS.textSecondary}
              />
              <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>
                No posts yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },

  backBtn: {
    paddingHorizontal: 5,
    marginTop: 10,
  },

  followBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    width: "60%",
    alignSelf: "center",
    borderRadius: 10,
  },
  followText: { textAlign: "center", color: "#fff", fontWeight: "700" },

  followingBtn: {
    marginTop: 18,
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    width: "60%",
    alignSelf: "center",
    borderRadius: 10,
  },
  followingText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
  },

  messageBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    width: "60%",
    alignSelf: "center",
    borderRadius: 10,
  },
  messageText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  postsTitle: {
    marginTop: 28,
    marginLeft: 18,
    marginBottom: 10,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    justifyContent: "center",
    marginTop: 10,
  },
  postImage: {
    width: 110,
    height: 110,
    margin: 6,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  noPostsBox: { alignItems: "center", marginTop: 30 },
});
