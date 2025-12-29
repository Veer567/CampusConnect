// app/(tabs)/other-profile.tsx

import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useProfileImageCache } from "@/hooks/useProfileImageCache";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfileContent from "@/components/Profile/ProfileContent";
import { ProfileHeader } from "@/components/Profile/ProfileHeader";

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

export default function OtherUserProfile() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const uid = userId as Id<"users">;

  const { userId: myClerkId } = useAuth();

  const me = useQuery(api.users.getUserByClerkId, {
    clerkId: myClerkId || "",
  });

  const user = useQuery(api.users.getUserProfile, { id: uid });
  const userPosts = useQuery(api.posts.getPostsByUser, { userId: uid });
  const isFollowing = useQuery(api.users.isFollowing, { followingId: uid });

  const toggleFollow = useMutation(api.users.toggleFollow);
  const getOrStartConv = useMutation(api.chat.getOrStartConversation);

  const imageCacheBuster = useProfileImageCache(uid);

  /* ──────────────────────────────────────────────
     ✅ PRIMARY + SECONDARY EMAILS (FIX)
  ────────────────────────────────────────────── */
  const allEmails = useMemo(() => {
    const set = new Set<string>();
    const primary = user?.email;
    const secondary = user?.emails || [];

    if (primary) set.add(primary); // PRIMARY EMAIL
    secondary.forEach((e) => set.add(e));

    return Array.from(set);
  }, [user?.email, user?.emails]);

  const isLoading = !me || !user;
  if (isLoading) return <ProfileSkeleton />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 50,
          paddingHorizontal: 15,
          marginTop: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          imageUrl={user.image}
          fullname={user.fullname}
          year={user.year || ""}
          editing={false}
          username={user.username}
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
          style={isFollowing ? styles.followingBtnNew : styles.followBtnNew}
          activeOpacity={0.7}
          onPress={() => toggleFollow({ followingId: user._id })}
        >
          {isFollowing ? (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.followBtnNewText}>Following</Text>
            </>
          ) : (
            <>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.followBtnNewText}>Follow</Text>
            </>
          )}
        </TouchableOpacity>

        {/* MESSAGE BUTTON */}
        <TouchableOpacity
          style={styles.messageBtnNew}
          activeOpacity={0.7}
          onPress={async () => {
            const conv = await getOrStartConv({ otherUserId: user._id });
            const conversationId =
              typeof conv === "object" && conv && "_id" in conv
                ? conv._id
                : conv;

            router.push(
              `/chat-screen?conversationId=${conversationId}&currentUserId=${me._id}&otherUserId=${user._id}`
            );
          }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
          <Text style={styles.messageBtnNewText}>Message</Text>
        </TouchableOpacity>

        {/* PROFILE CONTENT */}
        <View style={styles.contentCard}>
          <ProfileContent
            emails={allEmails} // ✅ FIXED HERE
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────────────────────────────────────────────
   SKELETON LOADING UI
─────────────────────────────────────────────── */

const Shimmer = ({ style }: any) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 350],
  });

  return (
    <View style={[{ backgroundColor: "#e7e7e7", overflow: "hidden" }, style]}>
      <Animated.View
        style={{
          width: 100,
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.45)",
          position: "absolute",
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

function ProfileSkeleton() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ padding: 20, paddingTop: 40 }}
    >
      <Shimmer
        style={{ width: 90, height: 90, borderRadius: 45, alignSelf: "center" }}
      />
      <View style={{ height: 20 }} />
      <Shimmer style={{ height: 20, width: "50%", alignSelf: "center" }} />
      <View style={{ height: 14 }} />
      <Shimmer style={{ height: 16, width: "30%", alignSelf: "center" }} />
    </ScrollView>
  );
}

/* ───────────────────────────────────────────────
   STYLES
─────────────────────────────────────────────── */

const styles = StyleSheet.create({
  followBtnNew: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 50,
    width: "75%",
    alignSelf: "center",
    elevation: 4,
  },
  followingBtnNew: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4caf50",
    paddingVertical: 14,
    borderRadius: 50,
    width: "75%",
    alignSelf: "center",
    elevation: 4,
  },
  followBtnNewText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: wp(4),
  },
  messageBtnNew: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#5865F2",
    paddingVertical: 14,
    borderRadius: 50,
    width: "75%",
    alignSelf: "center",
    elevation: 4,
  },
  messageBtnNewText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: wp(4),
  },
  contentCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginTop: 18,
    marginBottom: 20,
    elevation: 3,
  },
});
