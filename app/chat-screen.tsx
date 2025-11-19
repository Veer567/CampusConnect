// app/chat-screen.tsx
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const PAGE_SIZE = 50;

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId, currentUserId, otherUserId } = useLocalSearchParams();

  // cast — these are Convex user ids (you selected option B)
  const convId = conversationId as any;
  const meId = currentUserId as string; // Convex users._id
  const otherId = otherUserId as string;

  // fetch profiles
  const meProfile = useQuery(api.users.getUserProfile, { id: meId as any });
  const otherProfile = useQuery(api.users.getUserProfile, {
    id: otherId as any,
  });

  // messages (server returns messages newest-first; we reverse to oldest-first)
  const page = useQuery(api.chat.getMessagesPage, {
    conversationId: convId,
    pageSize: PAGE_SIZE,
  });

  const typingUsers = useQuery(api.chat.getTypingForConversation, {
    conversationId: convId,
  });

  // mutations
  const sendMessage = useMutation(api.chat.sendMessage);
  const startTyping = useMutation(api.chat.startTyping);
  const stopTyping = useMutation(api.chat.stopTyping);
  const markRead = useMutation(api.chat.markMessagesRead);

  // local UI state
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimer = useRef<any>(null);

  // merge server page -> local state (replace when server data changes)
  useEffect(() => {
    if (page?.messages) {
      // server returns desc (newest first). Reverse to oldest-first.
      const serverMsgs = [...page.messages].reverse();
      setMessages(serverMsgs);
      // scroll to bottom when new data arrives
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        80
      );
    }
  }, [page]);

  // mark read when messages update
  useEffect(() => {
    if (messages.length === 0) return;
    const lastTs = messages[messages.length - 1].createdAt;
    markRead({ conversationId: convId, upTo: lastTs }).catch(() => {});
  }, [messages]);

  // typing indicator management (optimistic)
  useEffect(() => {
    if (isTyping) {
      startTyping({ conversationId: convId }).catch(() => {});
      typingTimer.current = setInterval(() => {
        startTyping({ conversationId: convId }).catch(() => {});
      }, 3000);
    } else {
      if (typingTimer.current) clearInterval(typingTimer.current);
      stopTyping({ conversationId: convId }).catch(() => {});
    }
    return () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
      stopTyping({ conversationId: convId }).catch(() => {});
    };
  }, [isTyping]);

  // optimistic send: append a local message immediately then send to server
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
      // imageUrl: undefined
    };

    setMessages((prev) => [...prev, localMsg]);

    // scroll
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      // send to server
      await sendMessage({ conversationId: convId, text: trimmed });
      // server query subscription should bring authoritative message soon;
      // local message remains until replaced by server data on next page update.
    } catch (err) {
      console.error("sendMessage error", err);
      // Optionally mark local message as failed — omitted for brevity
    }
  };

  // pick image (placeholder: optimistic text message)
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.7,
      });
      if (result.canceled) return;
      // For now, send a placeholder text (you should upload and send storageId)
      setText("");
      const localMsg = {
        _id: `local-${Date.now()}`,
        conversationId: convId,
        senderId: meId,
        text: "📷 Image",
        createdAt: Date.now(),
        readBy: [meId],
      };
      setMessages((prev) => [...prev, localMsg]);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        80
      );
      await sendMessage({ conversationId: convId, text: "📷 Image" });
    } catch (err) {
      console.error("pickImage error", err);
    }
  };

  // Message bubble with zig-zag tail
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
          {/* Zig-zag tail */}
          <View
            style={{
              position: "absolute",
              top: 16,
              [mine ? "right" : "left"]: -10,
              width: 0,
              height: 0,
              borderTopWidth: 10,
              borderBottomWidth: 10,
              borderLeftWidth: mine ? 10 : 0,
              borderRightWidth: mine ? 0 : 10,
              borderTopColor: "transparent",
              borderBottomColor: "transparent",
              borderLeftColor: mine ? COLORS.primary : "transparent",
              borderRightColor: mine ? "transparent" : "#eaeaea",
            }}
          />

          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={{
                width: 220,
                height: 220,
                borderRadius: 10,
                marginBottom: 6,
              }}
            />
          )}

          {item.text && (
            <Text style={{ fontSize: 16, color: mine ? "#fff" : "#000" }}>
              {item.text}
            </Text>
          )}

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

          {mine && (
            <Text
              style={{
                fontSize: 10,
                color: "#fff",
                textAlign: "right",
                marginTop: 2,
              }}
            >
              {item.readBy && item.readBy.length > 1 ? "Seen" : "Delivered"}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const Header = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderColor: "#eee",
      }}
    >
      <TouchableOpacity onPress={() => router.push("/chat")}>
        <Ionicons name="arrow-back" size={30} />
      </TouchableOpacity>

      <Image
        source={{
          uri:
            otherProfile?.image ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        }}
        style={{ width: 42, height: 42, borderRadius: 22, marginLeft: 12 }}
      />

      <View style={{ marginLeft: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          {otherProfile?.fullname || "User"}
        </Text>
        {typingUsers?.length ? (
          <Text style={{ color: COLORS.primary }}>typing...</Text>
        ) : (
          <Text style={{ color: "#777" }}>online</Text>
        )}
      </View>
    </View>
  );

  // show loading if essential data missing
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
      <Header />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
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
