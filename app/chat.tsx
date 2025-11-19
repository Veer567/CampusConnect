// app/(tabs)/chat.tsx

import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/themes";
import AppHeader from "@/components/AppHeader";

/** Utility to format time (2m, 3h, Yesterday) */
function formatTime(timestamp?: number) {
  if (!timestamp) return "";
  const now = Date.now();
  const diff = now - timestamp;

  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days === 1) return "Yesterday";
  return `${days}d`;
}

export default function ChatListScreen() {
  const { userId: clerkId } = useAuth();

  // 1️⃣ Load Convex user for this Clerk user
  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip" // ← FIX
  );

  // 2️⃣ Skip until me exists
  const conversations = useQuery(
    api.chat.getMyConversations,
    me ? {} : "skip" // ← FIX
  );

  // 3️⃣ Load all users ( needed for avatars + names )
  const users = useQuery(api.users.searchUsers, { q: "" });

  if (!me || !conversations || !users) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <AppHeader title="Chats" rightIcon="chatbubbles" />

      {conversations.map((c) => {
        // find OTHER user (conv participants)
        const otherUserId = c.participants.find(
          (p: any) => String(p) !== String(me._id)
        );

        const otherUser = users.find(
          (u: any) => String(u._id) === String(otherUserId)
        );

        return (
          <TouchableOpacity
            key={c._id}
            onPress={() =>
              router.push(
                `/chat-screen?conversationId=${c._id}&currentUserId=${me._id}&otherUserId=${otherUserId}`
              )
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              marginBottom: 10,
              borderBottomWidth: 1.5,
              borderColor: "#eee",
            }}
          >
            {/* Avatar */}
            <Image
              source={{
                uri:
                  otherUser?.image ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              }}
              style={{
                width: 55,
                height: 55,
                borderRadius: 30,
                backgroundColor: "#ddd",
                marginLeft: 10,
              }}
            />

            {/* DETAILS */}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>
                {otherUser?.fullname || "Unknown User"}
              </Text>
              <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>
                {c.lastMessage || "Say hi 👋"}
              </Text>
            </View>

            {/* Time + unread badge */}
            <View style={{ alignItems: "flex-end", marginRight: 10 }}>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                {formatTime(c.lastMessageAt)}
              </Text>

              {c.unreadCount > 0 && (
                <View
                  style={{
                    backgroundColor: COLORS.primary,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12,
                    marginTop: 6,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "600",
                      fontSize: 12,
                    }}
                  >
                    {c.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
