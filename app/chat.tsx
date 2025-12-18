// app/chat-list.tsx
import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const AVATAR_SIZE = width * 0.15;
const ONLINE_THRESHOLD_MS = 30_000; // 30 seconds

/* ------------------------------------------------------
   ChatList — shows conversation rows
   - Uses api.chat.getMyConversations for conversations
   - Uses api.users.getUserProfile to get 'other' user profile and lastActive
   - online determination: other.lastActive within threshold
------------------------------------------------------ */
export default function ChatList() {
  const { userId: clerkId } = useAuth();

  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const conversations = useQuery(api.chat.getMyConversations, me ? {} : "skip");
  const users = useQuery(api.users.searchUsers, { q: "" }); // local cache of users

  const isLoading = !me || !conversations || !users;

  if (isLoading) {
    return <ChatListSkeleton />;
  }

  function formatTime(ts?: number) {
    if (!ts) return " ";
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    if (days === 1) return "yesterday";
    return `${days}d`;
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Chats" />

      <ScrollView>
        {conversations.map((c: any) => {
          // pick other participant for 1:1 chat
          const otherUserId = c.participants.find(
            (p: any) => String(p) !== String(me._id)
          );
          const other = users.find(
            (u: any) => String(u._id) === String(otherUserId)
          );

          // presence: check lastActive field on other (if your backend uses `lastActive` or `lastSeen`, adapt)
          const lastActive = (other as any)?.lastActive as number | undefined;
          const isOnline =
            typeof lastActive === "number" &&
            Date.now() - lastActive < ONLINE_THRESHOLD_MS;

          return (
            <TouchableOpacity
              key={c._id}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/chat-screen",
                  params: {
                    conversationId: String(c._id),
                    currentUserId: String(me._id),
                    otherUserId: String(otherUserId),
                  },
                })
              }
              style={styles.chatRow}
            >
              <View style={{ position: "relative" }}>
                <Image
                  source={{
                    uri:
                      other?.image ??
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={styles.avatar}
                />
                {isOnline && <View style={styles.onlineDot} />}
              </View>

              <View style={styles.middle}>
                <Text style={styles.name}>
                  {other?.fullname || other?.username || "Unknown"}
                </Text>

                <Text numberOfLines={1} style={styles.lastMsg}>
                  {c.lastMessage || "Say hi 👋"}
                </Text>
              </View>

              <View style={styles.right}>
                <Text style={styles.time}>{formatTime(c.lastMessageAt)}</Text>

                {c.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{c.unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------
   Skeleton while loading
------------------------------------------- */
const ChatListSkeleton = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1300,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  const Shimmer = () => (
    <Animated.View
      style={[chatSkeleton.shimmer, { transform: [{ translateX }] }]}
    />
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 16 }}>
        <View style={chatSkeleton.header} />
      </View>

      {Array.from({ length: 7 }).map((_, i) => (
        <View key={i} style={chatSkeleton.row}>
          <View style={chatSkeleton.avatar}>
            <Shimmer />
          </View>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={chatSkeleton.line1} />
            <View style={chatSkeleton.line2} />
          </View>

          <View style={chatSkeleton.time} />
        </View>
      ))}
    </ScrollView>
  );
};

/* ------------------------------------------
   Styles
------------------------------------------ */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  onlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: "#fff",
    position: "absolute",
    right: -1,
    bottom: -2,
  },
  middle: { flex: 1, marginLeft: 14 },
  name: { fontSize: 16, fontWeight: "700" },
  lastMsg: { marginTop: 4, fontSize: 14, color: "#777", maxWidth: "92%" },
  right: { alignItems: "flex-end" },
  time: { fontSize: 12, color: "#999" },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  username: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
});

/* ------------------------------------------
   Skeleton styles
------------------------------------------ */
const chatSkeleton = StyleSheet.create({
  shimmer: {
    position: "absolute",
    height: "100%",
    width: 120,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  header: {
    width: "40%",
    height: 28,
    backgroundColor: "#e9e9e9",
    borderRadius: 6,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#e3e3e3",
    overflow: "hidden",
  },
  line1: {
    width: "60%",
    height: 16,
    backgroundColor: "#e3e3e3",
    borderRadius: 6,
    marginBottom: 6,
  },
  line2: {
    width: "40%",
    height: 14,
    backgroundColor: "#e3e3e3",
    borderRadius: 6,
  },
  time: { width: 40, height: 14, borderRadius: 6, backgroundColor: "#e3e3e3" },
});
