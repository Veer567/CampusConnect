// app/chat-screen.tsx
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const BUBBLE_MAX_WIDTH = width * 0.78;
const ONLINE_THRESHOLD_MS = 30_000; // 30 seconds

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const convId = params.conversationId as unknown as Id<"conversations">;
  const meId = params.currentUserId as unknown as Id<"users">;
  const otherId = params.otherUserId as unknown as Id<"users">;

  // Queries
  const me = useQuery(api.users.getUserProfile, convId ? { id: meId } : "skip");
  const other = useQuery(
    api.users.getUserProfile,
    convId ? { id: otherId } : "skip"
  );
  const page = useQuery(
    api.chat.getMessagesPage,
    convId ? { conversationId: convId, pageSize: 200 } : "skip"
  );
  const typingUsers = useQuery(
    api.chat.getTypingForConversation,
    convId ? { conversationId: convId } : "skip"
  );

  // Mutations
  const sendMessage = useMutation(api.chat.sendMessage);
  const startTyping = useMutation(api.chat.startTyping);
  const stopTyping = useMutation(api.chat.stopTyping);
  const markRead = useMutation(api.chat.markMessagesRead);
  const deleteMessageMut = useMutation(api.chat.deleteMessage);
  const editMessageMut = useMutation(api.chat.editMessage);

  const flatRef = useRef<FlatList>(null);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const [isMenuVisible, setMenuVisible] = useState(false);
  const [menuForMessage, setMenuForMessage] = useState<any | null>(null);

  /* WHATSAPP STYLE EDITING */
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);

  const isOtherTyping = typingUsers?.some(
    (t: any) => String(t.userId) === String(otherId)
  );

  // Load messages
  useEffect(() => {
    if (!page?.messages) return;
    const sorted = [...page.messages].sort((a, b) => a.createdAt - b.createdAt);
    setMessages(sorted);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 40);
  }, [page]);

  // Mark read
  useEffect(() => {
    if (!messages.length || !convId) return;
    markRead({
      conversationId: convId,
      upTo: messages[messages.length - 1].createdAt,
    }).catch(() => {});
  }, [messages]);

  // Typing indicator
  useEffect(() => {
    if (!convId) return;
    if (text.length > 0)
      startTyping({ conversationId: convId }).catch(() => {});
    const t = setTimeout(() => {
      stopTyping({ conversationId: convId }).catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
  }, [text]);

  // Send Message
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !convId) return;

    const localId = "local-" + Date.now();
    const localMsg = {
      _id: localId,
      text: trimmed,
      senderId: meId,
      createdAt: Date.now(),
      readBy: [meId],
    };

    setMessages((prev) => [...prev, localMsg]);
    setText("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 30);

    try {
      await sendMessage({ conversationId: convId, text: trimmed });
    } catch (err) {
      console.error(err);
    }
  };

  /* --------------------------
   WHATSAPP STYLE EDITING
  --------------------------- */
  const startEditFlow = () => {
    if (!menuForMessage) return;
    setIsEditingMode(true);
    setEditingMessage(menuForMessage);
    setText(menuForMessage.text);
    setMenuVisible(false);

    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const cancelEdit = () => {
    setIsEditingMode(false);
    setEditingMessage(null);
    setText("");
  };

  const submitEdit = async () => {
    if (!editingMessage) return;

    const newText = text.trim();
    if (!newText) return cancelEdit();

    // optimistic
    setMessages((prev) =>
      prev.map((m) =>
        String(m._id) === String(editingMessage._id)
          ? { ...m, text: newText }
          : m
      )
    );

    await editMessageMut({
      messageId: editingMessage._id,
      text: newText,
    });

    cancelEdit();
  };

  /* --------------------------
      CONTEXT MENU
  --------------------------- */
  const handleMessageLongPress = (msg: any) => {
    if (String(msg.senderId) !== String(meId)) return;
    setMenuForMessage(msg);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuForMessage(null);
    setMenuVisible(false);
  };

  const handleDeleteMessage = async () => {
    if (!menuForMessage) return closeMenu();

    const id = menuForMessage._id;

    // optimistic
    setMessages((prev) => prev.filter((m) => m._id !== id));
    setMenuVisible(false);

    await deleteMessageMut({ messageId: id });
  };

  /* --------------------------
      ONLINE STATUS LOGIC
  --------------------------- */
  const isOtherOnline = (() => {
    const lastActive = (other as any)?.lastActive;
    if (!lastActive) return false;
    return Date.now() - lastActive < ONLINE_THRESHOLD_MS;
  })();

  /* --------------------------
      RENDER MESSAGE
  --------------------------- */
  const renderItem = ({ item }: { item: any }) => {
    const mine = String(item.senderId) === String(meId);

    return (
      <Pressable
        onLongPress={() => handleMessageLongPress(item)}
        delayLongPress={220}
        style={[
          styles.msgRow,
          { justifyContent: mine ? "flex-end" : "flex-start" },
        ]}
        android_ripple={{ color: "rgba(0,0,0,0.04)" }}
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
          <Text style={{ color: mine ? "#fff" : "#000" }}>{item.text}</Text>
          <Text style={styles.time}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </Pressable>
    );
  };

  /* --------------------------
      UI
  --------------------------- */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>

        <Image
          source={{
            uri:
              other?.image ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.avatar}
        />

        <View style={{ marginLeft: 12 }}>
          <Text style={styles.headerName}>{other?.fullname ?? "Chat"}</Text>
          <Text style={styles.typingText}>
            {isOtherTyping ? "typing…" : isOtherOnline ? "online" : "offline"}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* EDITING BANNER (WhatsApp) */}
      {isEditingMode && (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerTitle}>Editing message</Text>
          <Text numberOfLines={1} style={styles.editBannerPreview}>
            {editingMessage?.text}
          </Text>

          <Pressable onPress={cancelEdit}>
            <Ionicons name="close" size={20} color="#555" />
          </Pressable>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          placeholder="Message..."
          placeholderTextColor={COLORS.textSecondary}
          value={text}
          onChangeText={setText}
          style={styles.input}
        />

        <TouchableOpacity
          onPress={isEditingMode ? submitEdit : handleSend}
          disabled={!text.trim()}
        >
          <Ionicons
            name={isEditingMode ? "checkmark" : "send"}
            size={28}
            color={text.trim() ? COLORS.primary : "#bbb"}
          />
        </TouchableOpacity>
      </View>

      {/* Context Menu */}
      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={contextStyles.overlay} onPress={closeMenu}>
          <Animated.View style={contextStyles.box}>
            <Text style={contextStyles.title}>Message options</Text>

            <Pressable style={contextStyles.row} onPress={startEditFlow}>
              <Ionicons
                name="create-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={contextStyles.rowText}>Edit</Text>
            </Pressable>

            <Pressable style={contextStyles.row} onPress={handleDeleteMessage}>
              <Ionicons name="trash-outline" size={20} color="red" />
              <Text style={[contextStyles.rowText, { color: "red" }]}>
                Delete
              </Text>
            </Pressable>

            <Pressable
              style={[
                contextStyles.row,
                { justifyContent: "center", marginTop: 6 },
              ]}
              onPress={closeMenu}
            >
              <Text style={[contextStyles.rowText, { fontWeight: "700" }]}>
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* --------------------------
   STYLES
--------------------------- */
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: { width: 46, height: 46, borderRadius: 23, marginLeft: 8 },
  headerName: { fontSize: 17, fontWeight: "700" },
  typingText: { fontSize: 13, color: COLORS.primary, marginTop: 2 },

  msgRow: { flexDirection: "row", padding: 8 },
  bubble: { padding: 12, borderRadius: 16 },
  time: { fontSize: 10, opacity: 0.7, marginTop: 6, textAlign: "right" },

  inputBar: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 10,
  },

  /* WhatsApp Edit Banner */
  editBanner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f2f2f2",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  editBannerTitle: {
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 2,
    color: COLORS.primary,
  },
  editBannerPreview: {
    fontSize: 13,
    color: "#555",
    marginBottom: 6,
  },
});

/* Context menu styles */
const contextStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    elevation: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 12,
  },
  rowText: {
    fontSize: 16,
    color: COLORS.text,
  },
});
