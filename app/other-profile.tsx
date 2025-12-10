// app/(tabs)/other-profile.tsx

import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
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
import { Id } from "@/convex/_generated/dataModel";
import { useProfileImageCache } from "@/hooks/useProfileImageCache";
import { Ionicons } from "@expo/vector-icons";

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

  const isLoading = !me || !user;

  if (isLoading) return <ProfileSkeleton />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 15 }}
      >
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
        {/* Follow Button */}
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

        {/* Message Button */}
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

        <View style={styles.contentCard}>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/*───────────────────────────────────────────────
  SKELETON LOADING UI
───────────────────────────────────────────────*/

/*───────────────────────────────────────────────
  NEW SHIMMER (Same as ProfileScreen)
───────────────────────────────────────────────*/

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
    <View
      style={[
        {
          backgroundColor: "#e7e7e7",
          overflow: "hidden",
          position: "relative",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: 100,
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.45)",
          position: "absolute",
          top: 0,
          left: 0,
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
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER CARD */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          paddingVertical: 24,
          paddingHorizontal: 18,
          marginHorizontal: 6,
          elevation: 3,
        }}
      >
        {/* Avatar */}
        <Shimmer
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            alignSelf: "center",
            marginBottom: 16,
          }}
        />

        {/* Name */}
        <Shimmer
          style={{
            height: 20,
            width: "50%",
            alignSelf: "center",
            borderRadius: 6,
            marginBottom: 10,
          }}
        />

        {/* Year */}
        <Shimmer
          style={{
            height: 16,
            width: "30%",
            alignSelf: "center",
            borderRadius: 6,
            marginBottom: 18,
          }}
        />

        {/* Stats Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <Shimmer style={{ width: "30%", height: 60, borderRadius: 10 }} />
          <Shimmer style={{ width: "30%", height: 60, borderRadius: 10 }} />
          <Shimmer style={{ width: "30%", height: 60, borderRadius: 10 }} />
        </View>
      </View>

      {/* FOLLOW BUTTON */}
      <View style={{ marginTop: 25 }}>
        <Shimmer
          style={{
            height: 50,
            width: "70%",
            borderRadius: 12,
            alignSelf: "center",
          }}
        />
      </View>

      {/* MESSAGE BUTTON */}
      <View style={{ marginTop: 14 }}>
        <Shimmer
          style={{
            height: 50,
            width: "70%",
            borderRadius: 12,
            alignSelf: "center",
          }}
        />
      </View>

      {/* CONTENT SECTIONS */}
      <View style={{ marginTop: 30 }}>
        {/* Title */}
        <Shimmer
          style={{
            height: 20,
            width: "40%",
            borderRadius: 8,
            marginBottom: 20,
          }}
        />

        {/* Three rows */}
        {[1, 2, 3].map((i) => (
          <Shimmer
            key={i}
            style={{
              height: 45,
              borderRadius: 10,
              marginBottom: 16,
            }}
          />
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const sk = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },

  shimmer: {
    position: "absolute",
    width: 120,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.4)",
    opacity: 0.5,
    borderRadius: 12,
  },

  avatarBox: {
    marginTop: 30,
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e6e6e6",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: "#dcdcdc",
  },

  name: {
    width: "50%",
    height: 20,
    backgroundColor: "#e3e3e3",
    alignSelf: "center",
    marginTop: 20,
    borderRadius: 6,
  },
  year: {
    width: "30%",
    height: 16,
    backgroundColor: "#e5e5e5",
    alignSelf: "center",
    marginTop: 10,
    borderRadius: 6,
  },

  followBtn: {
    width: "70%",
    height: 50,
    backgroundColor: "#e4e4e4",
    alignSelf: "center",
    marginTop: 25,
    borderRadius: 12,
  },
  msgBtn: {
    width: "70%",
    height: 50,
    backgroundColor: "#e4e4e4",
    alignSelf: "center",
    marginTop: 14,
    borderRadius: 12,
  },

  section: {
    width: "85%",
    height: 18,
    backgroundColor: "#ebebeb",
    marginTop: 30,
    alignSelf: "center",
    borderRadius: 8,
  },

  line: {
    height: 14,
    width: "85%",
    backgroundColor: "#e2e2e2",
    alignSelf: "center",
    marginTop: 14,
    borderRadius: 6,
  },

  lineShort: {
    height: 14,
    width: "60%",
    backgroundColor: "#e2e2e2",
    alignSelf: "center",
    marginTop: 10,
    borderRadius: 6,
  },
});

/*───────────────────────────────────────────────
  REGULAR STYLES
───────────────────────────────────────────────*/

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 12, // ✔ consistent on all devices
    paddingTop: 10,
  },

  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },

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
  /* BEAUTIFUL FOLLOW BUTTON */
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
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  /* FOLLOWING (green gradient-ish look) */
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
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  followBtnNewText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: wp(4),
  },

  /* MESSAGE BUTTON */
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
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
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
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
