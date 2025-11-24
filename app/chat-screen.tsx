// app/chat-screen.tsx
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const BUBBLE_MAX_WIDTH = width * 0.78;

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // router params are strings. Cast to Convex Id types via unknown -> Id<...>
  const conversationIdParam = params.conversationId as string | undefined;
  const currentUserIdParam = params.currentUserId as string | undefined;
  const otherUserIdParam = params.otherUserId as string | undefined;

  const convId = conversationIdParam as unknown as
    | Id<"conversations">
    | undefined;
  const meId = currentUserIdParam as unknown as Id<"users"> | undefined;
  const otherId = otherUserIdParam as unknown as Id<"users"> | undefined;

  // If required params missing -> show loading + message
  if (!convId || !meId || !otherId) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.loadingText}>Opening chat…</Text>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Load user profiles (now passing typed Ids)
  const me = useQuery(api.users.getUserProfile, { id: meId });
  const other = useQuery(api.users.getUserProfile, { id: otherId });

  // Paginated messages (typed conversationId)
  const page = useQuery(api.chat.getMessagesPage, {
    conversationId: convId,
    pageSize: 80,
  });

  // typing indicator
  const typingUsers = useQuery(api.chat.getTypingForConversation, {
    conversationId: convId,
  });
  const isOtherTyping = typingUsers?.some(
    (t: any) => String(t.userId) === String(otherId)
  );

  const sendMessage = useMutation(api.chat.sendMessage);
  const startTyping = useMutation(api.chat.startTyping);
  const stopTyping = useMutation(api.chat.stopTyping);
  const markRead = useMutation(api.chat.markMessagesRead);

  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const flatRef = useRef<FlatList>(null);

  // sync messages when page updates
  useEffect(() => {
    if (!page?.messages) return;
    const sorted = [...page.messages].reverse();
    setMessages(sorted);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 40);
  }, [page]);

  // mark read: mark up to last message
  useEffect(() => {
    if (!messages.length) return;
    const lastTs = messages[messages.length - 1].createdAt;
    // pass typed convId
    markRead({ conversationId: convId, upTo: lastTs });
  }, [messages]);

  // typing
  useEffect(() => {
    if (!convId) return;
    if (text.length > 0) startTyping({ conversationId: convId });
    const timer = setTimeout(
      () => stopTyping({ conversationId: convId }),
      1000
    );
    return () => clearTimeout(timer);
  }, [text]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    const local = {
      _id: `local-${Date.now()}`,
      text: trimmed,
      senderId: meId,
      createdAt: Date.now(),
      readBy: [meId],
    };
    setMessages((p) => [...p, local]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 30);
    // pass typed convId
    await sendMessage({ conversationId: convId, text: trimmed });
  };

  const renderItem = ({ item }: { item: any }) => {
    const mine = String(item.senderId) === String(meId);
    const isEmojiOnly =
      /^[\p{Emoji}\s]+$/u.test(item.text || "") &&
      (item.text?.length ?? 0) <= 4;
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
              maxWidth: BUBBLE_MAX_WIDTH,
              backgroundColor: mine ? COLORS.primary : "#EFEFEF",
              borderBottomRightRadius: mine ? 4 : 18,
              borderBottomLeftRadius: mine ? 18 : 4,
            },
          ]}
        >
          {isEmojiOnly ? (
            <Text style={{ fontSize: 42 }}>{item.text}</Text>
          ) : (
            <Text
              style={{
                color: mine ? "#fff" : "#000",
                fontSize: 16,
                lineHeight: 22,
              }}
            >
              {item.text}
            </Text>
          )}
          <Text
            style={[
              styles.time,
              { color: mine ? "rgba(255,255,255,0.8)" : "#666" },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (!me || !other) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={26} />
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

      <FlatList
        ref={flatRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(i) => String(i._id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      />

      <View style={styles.inputBar}>
        <TextInput
          placeholder="Message…"
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centerScreen: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginBottom: 10, fontSize: 17 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#f2f2f2",
    backgroundColor: "#fff",
    elevation: 2,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, marginLeft: 8 },
  headerName: { fontSize: 17, fontWeight: "700" },
  typingText: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  msgRow: { flexDirection: "row", paddingHorizontal: 10, marginVertical: 6 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  time: { fontSize: 10, marginTop: 4, textAlign: "right" },
  inputBar: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    fontSize: 16,
    marginRight: 10,
  },
});
