// app/(tabs)/other-profile.tsx
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
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
  const { userId } = useLocalSearchParams();
  const uid = userId as Id<"users">;

  const user = useQuery(api.users.getUserProfile, { id: uid });
  const userPosts = useQuery(api.posts.getPostsByUser, { userId: uid });
  const isFollowing = useQuery(api.users.isFollowing, { followingId: uid });

  const toggleFollow = useMutation(api.users.toggleFollow);

  const imageCacheBuster = useProfileImageCache(userId as string);

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff",  marginLeft: 10,}}>
      <ScrollView
      
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {/* REUSE EXISTING PROFILE HEADER */}
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
        />


        {/* Follow Button */}
        <TouchableOpacity
          style={isFollowing ? styles.followingBtn : styles.followBtn}
          onPress={() => toggleFollow({ followingId: user._id })}
        >
          <Text style={isFollowing ? styles.followingText : styles.followText}>
            {isFollowing ? "Following ✔" : "Follow"}
          </Text>
        </TouchableOpacity>

        {/* REUSE EXISTING PROFILE CONTENT */}
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
              <Image
                key={p._id}
                source={{ uri: p.imageUrl }}
                style={styles.postImage}
              />
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
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center"
   },

backBtn: {
  paddingHorizontal: 5,

},


  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginTop: 10,
  },
  stat: { alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },

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
