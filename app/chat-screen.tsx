// app/chat-screen.tsx
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { Id } from "@/convex/_generated/dataModel";

const PAGE_SIZE = 50;

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId, currentUserId, otherUserId } = useLocalSearchParams();

  /** ──────────────────────────────────────────
   *  STEP 1: SAFELY PARSE PARAMS
   *  ────────────────────────────────────────── */
  const convId = conversationId as Id<"conversations"> | undefined;
  const meId = currentUserId as Id<"users"> | undefined;
  const otherId = otherUserId as Id<"users"> | undefined;

  /** If ANY required ID is missing, STOP IMMEDIATELY */
  if (!convId || !meId || !otherId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18 }}>Loading chat…</Text>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  /** ──────────────────────────────────────────
   *  STEP 2: QUERIES (SAFE — ONLY RUN WHEN IDs READY)
   *  ────────────────────────────────────────── */
  const meProfile = useQuery(api.users.getUserProfile, { id: meId });
  const otherProfile = useQuery(api.users.getUserProfile, { id: otherId });

  const page = useQuery(api.chat.getMessagesPage, {
    conversationId: convId,
    pageSize: PAGE_SIZE,
  });

  const typingUsers = useQuery(api.chat.getTypingForConversation, {
    conversationId: convId,
  });

  /** ──────────────────────────────────────────
   *  STEP 3: MUTATIONS
   *  ────────────────────────────────────────── */
  const sendMessage = useMutation(api.chat.sendMessage);
  const startTyping = useMutation(api.chat.startTyping);
  const stopTyping = useMutation(api.chat.stopTyping);
  const markRead = useMutation(api.chat.markMessagesRead);

  /** ────────────────────────────────────────── */
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimer = useRef<any>(null);

  /** ──────────────────────────────────────────
   *  Load messages when Convex page updates
   *  ────────────────────────────────────────── */
  useEffect(() => {
    if (!page?.messages) return;

    const serverMsgs = [...page.messages].reverse();
    setMessages(serverMsgs);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, [page]);

  /** ──────────────────────────────────────────
   *  Mark messages as read
   *  ────────────────────────────────────────── */
  useEffect(() => {
    if (!messages.length) return;

    const lastTs = messages[messages.length - 1].createdAt;
    markRead({ conversationId: convId, upTo: lastTs }).catch(() => {});
  }, [messages]);

  /** ──────────────────────────────────────────
   *  Typing indicator logic (safe)
   *  ────────────────────────────────────────── */
  useEffect(() => {
    if (!convId) return;

    if (isTyping) {
      startTyping({ conversationId: convId }).catch(() => {});
      typingTimer.current = setInterval(() => {
        startTyping({ conversationId: convId }).catch(() => {});
      }, 3000);
    } else {
      stopTyping({ conversationId: convId }).catch(() => {});
      if (typingTimer.current) clearInterval(typingTimer.current);
    }

    return () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
      stopTyping({ conversationId: convId }).catch(() => {});
    };
  }, [isTyping]);

  /** ──────────────────────────────────────────
   *  Send Message
   *  ────────────────────────────────────────── */
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText("");
    setIsTyping(false);

    const localMsg = {
      _id: `local-${Date.now()}`,
      conversationId: convId,
      senderId: meId,
      text: trimmed,
      createdAt: Date.now(),
      readBy: [meId],
    };

    setMessages((prev) => [...prev, localMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    await sendMessage({ conversationId: convId, text: trimmed });
  };

  /** ──────────────────────────────────────────
   *  Pick Image (placeholder implementation)
   *  ────────────────────────────────────────── */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (result.canceled) return;

    await sendMessage({ conversationId: convId, text: "📷 Image" });
  };

  /** ──────────────────────────────────────────
   *  UI: Message bubble
   *  ────────────────────────────────────────── */
  const renderItem = ({ item }: { item: any }) => {
    const mine = String(item.senderId) === String(meId);

    return (
      <View
        style={{
          flexDirection: mine ? "row-reverse" : "row",
          paddingHorizontal: 12,
          marginVertical: 8,
        }}
      >
        <View
          style={{
            backgroundColor: mine ? COLORS.primary : "#eaeaea",
            maxWidth: "78%",
            padding: 12,
            borderRadius: 14,
            position: "relative",
            marginLeft: mine ? 0 : 14,
            marginRight: mine ? 14 : 0,
          }}
        >
          <Text style={{ fontSize: 16, color: mine ? "#fff" : "#000" }}>
            {item.text}
          </Text>

          <Text
            style={{
              fontSize: 10,
              textAlign: "right",
              marginTop: 6,
              color: mine ? "#f2f2f2" : "#666",
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

  /** ──────────────────────────────────────────
   *  Header
   *  ────────────────────────────────────────── */
  if (!meProfile || !otherProfile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          borderBottomWidth: 1,
          borderColor: "#eee",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>

        <Image
          source={{
            uri: otherProfile.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={{ width: 42, height: 42, borderRadius: 22, marginLeft: 12 }}
        />

        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            {otherProfile.fullname}
          </Text>
          <Text style={{ color: COLORS.primary }}>
            {typingUsers?.length ? "typing…" : "online"}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingVertical: 12 }}
      />

      {/* Input */}
      <View
        style={{
          flexDirection: "row",
          padding: 10,
          borderTopWidth: 1,
          borderColor: "#ddd",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={pickImage}>
          <Ionicons name="image" size={28} color={COLORS.primary} />
        </TouchableOpacity>

        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            setIsTyping(t.length > 0);
          }}
          placeholder="Message..."
          style={{
            flex: 1,
            backgroundColor: "#f1f1f1",
            padding: 12,
            borderRadius: 25,
            marginHorizontal: 10,
            fontSize: 16,
          }}
        />

        <TouchableOpacity onPress={handleSend}>
          <Ionicons name="send" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
