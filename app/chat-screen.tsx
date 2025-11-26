// FIXED chat-screen.tsx (NO HOOK ERRORS)

import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { Animated } from "react-native";

const { width } = Dimensions.get("window");
const BUBBLE_MAX_WIDTH = width * 0.78;

/* ------------------------------------------
   SKELETON (unchanged, safe to reuse)
------------------------------------------ */
const ChatScreenSkeleton = () => {
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
      style={[sk.shimmer, { transform: [{ translateX }] }]}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={sk.header}>
        <View style={sk.headerAvatar}><Shimmer /></View>
        <View style={{ marginLeft: 12 }}>
          <View style={sk.headerLine1} />
          <View style={sk.headerLine2} />
        </View>
      </View>

      <View style={{ padding: 14 }}>
        {[...Array(7)].map((_, i) => (
          <View
            key={i}
            style={[sk.msgBubble, i % 2 ? sk.right : sk.left]}
          >
            <Shimmer />
          </View>
        ))}
      </View>

      <View style={sk.inputBox} />
    </View>
  );
};

/* ------------------------------------------
   MAIN CHAT SCREEN (FIXED)
------------------------------------------ */
export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const convId = params.conversationId as unknown as Id<"conversations">;
  const meId = params.currentUserId as unknown as Id<"users">;
  const otherId = params.otherUserId as unknown as Id<"users">;

  // Load data
  const me = useQuery(api.users.getUserProfile, convId ? { id: meId } : "skip");
  const other = useQuery(api.users.getUserProfile, convId ? { id: otherId } : "skip");
  const page = useQuery(api.chat.getMessagesPage, convId ? {
    conversationId: convId,
    pageSize: 80,
  } : "skip");

  const typingUsers = useQuery(api.chat.getTypingForConversation, convId ? {
    conversationId: convId,
  } : "skip");

  const isLoading = !convId || !me || !other || !page;

  // Mutations
  const sendMessage = useMutation(api.chat.sendMessage);
  const startTyping = useMutation(api.chat.startTyping);
  const stopTyping = useMutation(api.chat.stopTyping);
  const markRead = useMutation(api.chat.markMessagesRead);

  const flatRef = useRef<FlatList>(null);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const isOtherTyping = typingUsers?.some(
    (t: any) => String(t.userId) === String(otherId)
  );

  /* ------------------------------------------
     Hooks (always executed — safe)
  ------------------------------------------ */

  // When page messages update
  useEffect(() => {
    if (!page?.messages) return;
    const sorted = [...page.messages].reverse();
    setMessages(sorted);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 40);
  }, [page]);

  // Mark as read
  useEffect(() => {
    if (!messages.length || !convId) return;
    markRead({
      conversationId: convId,
      upTo: messages[messages.length - 1].createdAt,
    });
  }, [messages]);

  // Typing indicator
  useEffect(() => {
    if (!convId) return;

    if (text.length > 0) startTyping({ conversationId: convId });

    const timer = setTimeout(() => {
      stopTyping({ conversationId: convId });
    }, 1000);

    return () => clearTimeout(timer);
  }, [text]);

  /* ------------------------------------------
     SEND MESSAGE
  ------------------------------------------ */
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText("");

    const localMsg = {
      _id: "local-" + Date.now(),
      text: trimmed,
      senderId: meId,
      createdAt: Date.now(),
      readBy: [meId],
    };

    setMessages((prev) => [...prev, localMsg]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 30);

    await sendMessage({ conversationId: convId, text: trimmed });
  };

  /* ------------------------------------------
     UI RENDER
  ------------------------------------------ */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* If loading: show skeleton */}
      {isLoading ? (
        <ChatScreenSkeleton />
      ) : (
        <>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={28} />
            </TouchableOpacity>

            <Image
              source={{
                uri:
                  other.image ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              }}
              style={styles.avatar}
            />

            <View style={{ marginLeft: 12 }}>
              <Text style={styles.headerName}>{other.fullname}</Text>
              <Text style={styles.typingText}>
                {isOtherTyping ? "typing…" : "online"}
              </Text>
            </View>
          </View>

          {/* MESSAGES */}
          <FlatList
            ref={flatRef}
            data={messages}
            renderItem={({ item }) => {
              const mine = String(item.senderId) === String(meId);
              return (
                <View
                  style={[
                    styles.msgRow,
                    { justifyContent: mine ? "flex-end" : "flex-start" },
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: mine ? COLORS.primary : "#eee",
                        maxWidth: BUBBLE_MAX_WIDTH,
                      },
                    ]}
                  >
                    <Text style={{ color: mine ? "#fff" : "#000" }}>
                      {item.text}
                    </Text>
                    <Text style={styles.time}>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              );
            }}
            keyExtractor={(item) => String(item._id)}
            contentContainerStyle={{ paddingBottom: 30 }}
          />

          {/* INPUT BAR */}
          <View style={styles.inputBar}>
            <TextInput
              placeholder="Message..."
              value={text}
              onChangeText={setText}
              style={styles.input}
            />
            <TouchableOpacity onPress={handleSend} disabled={!text.trim()}>
              <Ionicons
                name="send"
                size={28}
                color={text.trim() ? COLORS.primary : "#bbb"}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

/* ------------------------------------------
   STYLES
------------------------------------------ */
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: { width: 46, height: 46, borderRadius: 23, marginLeft: 8 },
  headerName: { fontSize: 17, fontWeight: "700" },
  typingText: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  msgRow: { flexDirection: "row", padding: 10 },
  bubble: { padding: 12, borderRadius: 16 },
  time: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
    textAlign: "right",
  },
  inputBar: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 10,
  },
});

/* ------------------------------------------
   SKELETON STYLES
------------------------------------------ */
const sk = StyleSheet.create({
  shimmer: {
    width: 120,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.5)",
    position: "absolute",
  },
  header: {
    flexDirection: "row",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerAvatar: {
    width: 46,
    height: 46,
    backgroundColor: "#e3e3e3",
    borderRadius: 23,
    overflow: "hidden",
  },
  headerLine1: {
    width: 120,
    height: 16,
    backgroundColor: "#e3e3e3",
    borderRadius: 6,
  },
  headerLine2: {
    width: 70,
    height: 12,
    marginTop: 6,
    backgroundColor: "#e3e3e3",
    borderRadius: 6,
  },
  msgBubble: {
    height: 42,
    backgroundColor: "#e3e3e3",
    borderRadius: 12,
    marginVertical: 10,
    overflow: "hidden",
  },
  left: { width: "70%", alignSelf: "flex-start" },
  right: { width: "70%", alignSelf: "flex-end" },
  inputBox: {
    height: 50,
    backgroundColor: "#e3e3e3",
    margin: 14,
    borderRadius: 26,
  },
});
