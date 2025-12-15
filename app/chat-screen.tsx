import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
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

/* ---------------- Utils ---------------- */

const isSameDay = (a: number, b: number) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

const getDateLabel = (ts: number) => {
  const now = new Date();
  const date = new Date(ts);

  if (isSameDay(ts, now.getTime())) return "Today";

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(ts, yesterday.getTime())) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* ---------------- Screen ---------------- */

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const convId = params.conversationId as Id<"conversations">;
  const meId = params.currentUserId as Id<"users">;
  const otherId = params.otherUserId as Id<"users">;

  /* ---------------- Queries ---------------- */

  const other = useQuery(
    api.users.getUserProfile,
    convId ? { id: otherId } : "skip"
  );

  const presence = useQuery(
    api.chat.getUserPresence,
    otherId ? { userId: otherId } : "skip"
  );

  const messages = useQuery(
    api.chat.getMessagesLive,
    convId ? { conversationId: convId } : "skip"
  );

  const typingUsers = useQuery(
    api.chat.getTypingForConversation,
    convId ? { conversationId: convId } : "skip"
  );

  /* ---------------- Mutations ---------------- */

  const sendMessage = useMutation(api.chat.sendMessage);
  const startTyping = useMutation(api.chat.startTyping);
  const stopTyping = useMutation(api.chat.stopTyping);
  const markRead = useMutation(api.chat.markMessagesRead);
  const deleteMessageMut = useMutation(api.chat.deleteMessage);
  const editMessageMut = useMutation(api.chat.editMessage);

  /* ---------------- State ---------------- */

  const flatRef = useRef<FlatList>(null);

  const [text, setText] = useState("");
  const [menuForMessage, setMenuForMessage] = useState<any | null>(null);
  const [isMenuVisible, setMenuVisible] = useState(false);

  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);

  const isOtherTyping = typingUsers?.some(
    (t: any) => String(t.userId) === String(otherId)
  );

  /* ---------------- Keyboard-safe scroll ---------------- */

  const scrollToBottom = (animated = true) => {
    InteractionManager.runAfterInteractions(() => {
      flatRef.current?.scrollToOffset({ offset: 0, animated });
    });
  };

  /* ---------------- Effects ---------------- */

  useEffect(() => {
    if (!messages?.length || !convId) return;

    markRead({
      conversationId: convId,
      upTo: messages[0].createdAt,
    }).catch(() => {});

    scrollToBottom(false);
  }, [messages]);

  useEffect(() => {
    if (!convId) return;

    if (text.length > 0) startTyping({ conversationId: convId });

    const t = setTimeout(() => stopTyping({ conversationId: convId }), 800);
    return () => clearTimeout(t);
  }, [text]);

  /* ---------------- Send ---------------- */

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !convId) return;

    setText("");
    scrollToBottom();

    await sendMessage({
      conversationId: convId,
      text: trimmed,
    });
  };

  /* ---------------- Edit / Delete ---------------- */

  const startEditFlow = () => {
    if (!menuForMessage) return;
    setIsEditingMode(true);
    setEditingMessage(menuForMessage);
    setText(menuForMessage.text);
    setMenuVisible(false);
  };

  const submitEdit = async () => {
    if (!editingMessage) return;

    const newText = text.trim();
    if (!newText) return;

    await editMessageMut({
      messageId: editingMessage._id,
      text: newText,
    });

    setIsEditingMode(false);
    setEditingMessage(null);
    setText("");
  };

  const handleDeleteMessage = async () => {
    if (!menuForMessage) return;
    await deleteMessageMut({ messageId: menuForMessage._id });
    setMenuVisible(false);
  };

  /* ---------------- Render Message ---------------- */

  const renderItem = ({ item, index }: any) => {
    const mine = String(item.senderId) === String(meId);
    const prev = messages?.[index + 1];
    const showDate = !prev || !isSameDay(prev.createdAt, item.createdAt);

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{getDateLabel(item.createdAt)}</Text>
          </View>
        )}

        <Pressable
          onLongPress={() => {
            if (mine) {
              setMenuForMessage(item);
              setMenuVisible(true);
            }
          }}
          style={[
            styles.msgRow,
            { justifyContent: mine ? "flex-end" : "flex-start" },
          ]}
        >
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: mine ? COLORS.primary : "#EEE",
                maxWidth: BUBBLE_MAX_WIDTH,
              },
            ]}
          >
            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                onLoadEnd={() => scrollToBottom(false)} // 🔥 image height fix
              />
            )}

            {item.text && (
              <Text style={{ color: mine ? "#fff" : "#000" }}>{item.text}</Text>
            )}

            <Text style={styles.time}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </Pressable>
      </>
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/other-profile",
              params: { userId: otherId },
            })
          }
        >
          <Image
            source={{
              uri:
                other?.image ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>

        <View style={{ marginLeft: 10 }}>
          <Text style={styles.headerName}>
            {other?.fullname || other?.username}
          </Text>
          <Text style={styles.typingText}>
            {isOtherTyping
              ? "typing…"
              : presence?.online
                ? "online"
                : "offline"}
          </Text>
        </View>
      </View>

      {/* Messages (INVERTED) */}
      <FlatList
        ref={flatRef}
        data={messages}
        inverted
        keyExtractor={(i) => String(i._id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Edit Banner */}
      {isEditingMode && (
        <View style={styles.editBanner}>
          <Text>Editing message</Text>
          <Pressable onPress={() => setIsEditingMode(false)}>
            <Ionicons name="close" size={18} />
          </Pressable>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          placeholder="Message..."
          value={text}
          onChangeText={setText}
          style={styles.input}
        />
        <TouchableOpacity onPress={isEditingMode ? submitEdit : handleSend}>
          <Ionicons
            name={isEditingMode ? "checkmark" : "send"}
            size={26}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Menu */}
      {/* Action Sheet Modal */}
      <Modal visible={isMenuVisible} transparent animationType="fade">
        <Pressable
          style={sheetStyles.backdrop}
          onPress={() => setMenuVisible(false)}
        >
          <View style={sheetStyles.sheet}>
            {/* Handle */}
            <View style={sheetStyles.handle} />

            {/* Edit */}
            <Pressable
              style={({ pressed }) => [
                sheetStyles.actionRow,
                pressed && sheetStyles.pressed,
              ]}
              onPress={startEditFlow}
            >
              <Ionicons name="create-outline" size={22} color="#111" />
              <Text style={sheetStyles.actionText}>Edit Message</Text>
            </Pressable>

            {/* Divider */}
            <View style={sheetStyles.divider} />

            {/* Delete */}
            <Pressable
              style={({ pressed }) => [
                sheetStyles.actionRow,
                pressed && sheetStyles.pressed,
              ]}
              onPress={handleDeleteMessage}
            >
              <Ionicons name="trash-outline" size={22} color="#ff3b30" />
              <Text style={[sheetStyles.actionText, { color: "#ff3b30" }]}>
                Delete Message
              </Text>
            </Pressable>

            {/* Cancel */}
            <Pressable
              style={sheetStyles.cancel}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={sheetStyles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginLeft: 10 },
  headerName: { fontWeight: "700", fontSize: 16 },
  typingText: { fontSize: 12, color: COLORS.primary },

  msgRow: { flexDirection: "row", padding: 8 },
  bubble: { padding: 12, borderRadius: 16 },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  time: { fontSize: 10, opacity: 0.7 },

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

  newMsgButton: {
    position: "absolute",
    right: 15,
    bottom: 100,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  dateSeparator: {
    alignItems: "center",
    marginVertical: 10,
  },
  dateText: {
    backgroundColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },

  editBanner: {
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  editBannerTitle: {
    fontWeight: "700",
    fontSize: 13,
    color: COLORS.primary,
  },
  editBannerPreview: {
    fontSize: 13,
    color: "#555",
  },
  image: {
    width: BUBBLE_MAX_WIDTH - 24,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

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
  },
  row: {
    paddingVertical: 12,
  },

  
});
const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 14,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  actionText: {
    fontSize: 16,
    marginLeft: 14,
    fontWeight: "500",
    color: "#111",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
  },

  pressed: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
  },

  cancel: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
  },

  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
