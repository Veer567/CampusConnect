import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/themes";
import AppHeader from "@/components/AppHeader";

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

  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  const conversations = useQuery(
    api.chat.getMyConversations,
    me ? {} : "skip"
  );

  const users = useQuery(api.users.searchUsers, { q: "" });
  


  if (!me || !conversations || !users) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading chats…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <AppHeader title="Chats" rightIcon="chatbubbles" />

      {conversations.map((c) => {
        const otherUserId = c.participants.find(
          (p: any) => String(p) !== String(me._id)
        );

        const other = users.find((u) => String(u._id) === String(otherUserId));

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
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderBottomColor: "#f1f1f1",
              borderBottomWidth: 1,
            }}
          >
            {/* Avatar + online dot */}
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: other?.image ?? "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 30,
                }}
              />

              <View
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 7,
                  backgroundColor: COLORS.primary,
                  borderWidth: 2,
                  borderColor: "#fff",
                  position: "absolute",
                  right: -1,
                  bottom: -1,
                }}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                {other?.fullname}
              </Text>

              <Text
                numberOfLines={1}
                style={{ color: "#777", marginTop: 4, maxWidth: "92%" }}
              >
                {c.lastMessage || "Say hi 👋"}
              </Text>
            </View>

            {/* Time + unread badge */}
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 12, color: "#777" }}>
                {formatTime(c.lastMessageAt)}
              </Text>

              {c.unreadCount > 0 && (
                <View
                  style={{
                    backgroundColor: COLORS.primary,
                    minWidth: 24,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 12,
                    marginTop: 6,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: 13,
                      textAlign: "center",
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
