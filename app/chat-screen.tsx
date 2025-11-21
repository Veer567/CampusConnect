import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

const PAGE_SIZE = 75;

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId, currentUserId, otherUserId } = useLocalSearchParams();

  // SAFE IDS
  const convId = conversationId as Id<"conversations"> | undefined;
  const meId = currentUserId as Id<"users"> | undefined;
  const otherId = otherUserId as Id<"users"> | undefined;

  if (!convId || !meId || !otherId) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.loadingText}>Opening chat…</Text>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // LOAD DATA
  const me = useQuery(api.users.getUserProfile, { id: meId });
  const other = useQuery(api.users.getUserProfile, { id: otherId });

  const page = useQuery(api.chat.getMessagesPage, {
    conversationId: convId,
    pageSize: PAGE_SIZE,
  });

  const typingUsers = useQuery(api.chat.getTypingForConversation, {
    conversationId: convId,
  });

  const sendMessage = useMutation(api.chat.sendMessage);
  const startTyping = useMutation(api.chat.startTyping);
  const stopTyping = useMutation(api.chat.stopTyping);
  const markRead = useMutation(api.chat.markMessagesRead);

  // LOCAL STATE
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const flatRef = useRef<FlatList>(null);
  const typingTimer = useRef<any>(null);

  const isOtherTyping = typingUsers?.some(
    (t) => String(t.userId) === String(otherId)
  );

  // SYNC MESSAGES
  useEffect(() => {
    if (!page?.messages) return;

    const serverMsgs = [...page.messages].reverse();
    setMessages(serverMsgs);

    setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 40);
  }, [page]);

  // MARK READ
  useEffect(() => {
    if (!messages?.length) return;

    const lastTs = messages[messages.length - 1].createdAt;
    markRead({ conversationId: convId, upTo: lastTs }).catch(() => {});
  }, [messages]);

  // TYPING
  useEffect(() => {
    if (!convId) return;

    if (text.length > 0) {
      startTyping({ conversationId: convId }).catch(() => {});
      typingTimer.current = setInterval(() => {
        startTyping({ conversationId: convId }).catch(() => {});
      }, 3000);
    } else {
      stopTyping({ conversationId: convId }).catch(() => {});
      clearInterval(typingTimer.current);
    }

    return () => {
      clearInterval(typingTimer.current);
      stopTyping({ conversationId: convId }).catch(() => {});
    };
  }, [text]);

  // SEND MESSAGE
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText("");

    // LOCAL MESSAGE
    const local = {
      _id: `local-${Date.now()}`,
      conversationId: convId,
      senderId: meId,
      text: trimmed,
      createdAt: Date.now(),
      readBy: [meId],
    };

    setMessages((prev) => [...prev, local]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 40);

    await sendMessage({
      conversationId: convId,
      text: trimmed,
    });
  };

  // RENDER MESSAGE BUBBLE
  const renderItem = ({ item }: { item: any }) => {
    const mine = String(item.senderId) === String(meId);

    const isEmojiOnly =
      /^[\p{Emoji}\s]+$/u.test(item.text || "") &&
      (item.text?.length ?? 0) <= 4;

    return (
      <View
        style={{
          flexDirection: mine ? "row-reverse" : "row",
          paddingHorizontal: 10,
          marginVertical: 6,
        }}
      >
        <View
          style={{
            backgroundColor: mine ? COLORS.primary : "#EDEDED",
            padding: isEmojiOnly ? 4 : 10,
            borderRadius: 18,
            maxWidth: "75%",
            borderBottomRightRadius: mine ? 2 : 18,
            borderBottomLeftRadius: mine ? 18 : 2,
          }}
        >
          {/* EMOJI ONLY */}
          {isEmojiOnly ? (
            <Text style={{ fontSize: 46 }}>{item.text}</Text>
          ) : (
            <Text
              style={{
                color: mine ? "#fff" : "#000",
                fontSize: 15,
              }}
            >
              {item.text}
            </Text>
          )}

          <Text
            style={{
              fontSize: 10,
              marginTop: 4,
              textAlign: "right",
              color: mine ? "#eee" : "#555",
            }}
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
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
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
          {isOtherTyping ? (
            <Text style={styles.typingText}>typing…</Text>
          ) : (
            <Text style={styles.onlineText}>online</Text>
          )}
        </View>
      </View>

      {/* MESSAGES */}
      <FlatList
        ref={flatRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      {/* INPUT */}
      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message…"
          style={styles.input}
        />

        <TouchableOpacity onPress={handleSend}>
          <Ionicons name="send" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/*───────────────────────────────────────────────
  STYLES
───────────────────────────────────────────────*/
const styles = StyleSheet.create({
  centerScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginBottom: 10,
    fontSize: 17,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#f2f2f2",
    backgroundColor: "#fff",
    elevation: 3,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 17,
    fontWeight: "600",
  },
  typingText: {
    color: COLORS.primary,
    fontSize: 13,
  },
  onlineText: {
    color: "#909090",
    fontSize: 13,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#e6e6e6",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    marginHorizontal: 10,
    fontSize: 16,
  },
});
