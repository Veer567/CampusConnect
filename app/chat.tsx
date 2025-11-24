// app/chat.tsx
import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const AVATAR_SIZE = width * 0.15;

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

export default function ChatList() {
  const { userId: clerkId } = useAuth();

  // get Convex user for current Clerk identity
  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  // get conversations only after we have me
  const conversations = useQuery(api.chat.getMyConversations, me ? {} : "skip");

  // lightweight user list to resolve other user's profile (client-side cache). You can replace with a better query.
  const users = useQuery(api.users.searchUsers, { q: "" });

  if (!me || !conversations || !users) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading chats…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Chats" rightIcon="chatbubbles" />
      {conversations.map((c: any) => {
        const otherUserId = c.participants.find(
          (p: any) => String(p) !== String(me._id)
        );
        const other = users.find(
          (u: any) => String(u._id) === String(otherUserId)
        );

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
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.middle}>
              <Text style={styles.name}>{other?.fullname || "Unknown"}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: { fontSize: 16, color: COLORS.textSecondary },
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
  middle: { flex: 1, marginLeft: 14, justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  lastMsg: { marginTop: 4, fontSize: 14, color: "#777", maxWidth: "92%" },
  right: { alignItems: "flex-end", justifyContent: "center" },
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
    color: "#fff",
    textAlign: "center",
  },
});
