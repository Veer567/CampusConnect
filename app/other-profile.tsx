// app/(tabs)/other-profile.tsx

import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileContent } from "@/components/Profile/ProfileContent";
import { ProfileHeader } from "@/components/Profile/ProfileHeader";
import { Id } from "@/convex/_generated/dataModel";
import { useProfileImageCache } from "@/hooks/useProfileImageCache";
import { Loader } from "@/components/Loader";

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

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
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={COLORS.text} />
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
          <Text style={styles.followBtnText}>
            {isFollowing ? "Following ✔" : "Follow"}
          </Text>
        </TouchableOpacity>

        {/* MESSAGE */}
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={async () => {
            const conv = await getOrStartConv({
              otherUserId: user._id,
            });

            const conversationId =
              typeof conv === "object" && conv && "_id" in conv
                ? conv._id
                : conv;

            router.push(
              `/chat-screen?conversationId=${conversationId}&currentUserId=${me._id}&otherUserId=${user._id}`
            );
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
      </ScrollView>
    </SafeAreaView>
  );
}

/*───────────────────────────────────────────────
  STYLES (Responsive)
───────────────────────────────────────────────*/
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 10,
  },

  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },

  backBtn: {
    paddingHorizontal: wp(3),
    paddingVertical: wp(2),
    marginTop: 8,
  },

  followBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    width: "70%",
    alignSelf: "center",
    borderRadius: 12,
  },
  followingBtn: {
    marginTop: 20,
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    width: "70%",
    alignSelf: "center",
    borderRadius: 12,
  },
  followBtnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: wp(4),
  },

  messageBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    width: "70%",
    alignSelf: "center",
    borderRadius: 12,
  },
  messageText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: wp(4),
  },

  postsTitle: {
    marginTop: 30,
    marginLeft: wp(4),
    marginBottom: 10,
    fontSize: wp(5),
    fontWeight: "700",
    color: COLORS.text,
  },

  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: wp(2),
  },

  postImage: {
    width: width * 0.28,
    height: width * 0.28,
    margin: wp(2),
    borderRadius: 12,
    backgroundColor: "#eee",
  },

  noPostsBox: {
    marginTop: 40,
    alignItems: "center",
  },
  noPostsText: {
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});
