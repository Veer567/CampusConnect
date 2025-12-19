import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const BUBBLE_MAX_WIDTH = width * 0.78;

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
  const markAllNotificationsRead = useMutation(
    api.notifications.markAllNotificationsRead
  );

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

  /* ---------------- Effects ---------------- */

  useFocusEffect(
    useCallback(() => {
      markAllNotificationsRead();
    }, [])
  );

  useEffect(() => {
    if (!messages?.length || !convId) return;
    markRead({ conversationId: convId }).catch(() => {});
    scrollToBottom(false);
  }, [messages]);

  useEffect(() => {
    if (!convId) return;
    if (text.length > 0) startTyping({ conversationId: convId });
    const t = setTimeout(() => stopTyping({ conversationId: convId }), 800);
    return () => clearTimeout(t);
  }, [text]);

  /* ---------------- Helpers ---------------- */

  const scrollToBottom = (animated = true) => {
    InteractionManager.runAfterInteractions(() => {
      flatRef.current?.scrollToOffset({ offset: 0, animated });
    });
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !convId) return;

    setText("");
    scrollToBottom();

    if (isEditingMode && editingMessage) {
      await editMessageMut({
        messageId: editingMessage._id,
        text: trimmed,
      });
      setIsEditingMode(false);
      setEditingMessage(null);
      return;
    }

    await sendMessage({
      conversationId: convId,
      text: trimmed,
    });
  };

  const handleBack = () => {
    if (params.from === "notifications") {
      router.replace("/notifications");
      return;
    }
    router.canGoBack() ? router.back() : router.replace("/(tabs)");
  };

  /* ---------------- Render Message ---------------- */

  const renderItem = ({ item }: any) => {
    const mine = String(item.senderId) === String(meId);

    return (
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
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          )}

          {item.text && (
            <Text style={{ color: mine ? "#fff" : "#000" }}>
              {item.text}
            </Text>
          )}

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

  /* ---------------- UI ---------------- */

  return (
    <>


      <View style={styles.container}>
        {/* 🔒 FIXED HEADER (NEVER MOVES) */}
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack}>
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
        </SafeAreaView>

        {/* 🟢 CHAT BODY (PANS, HEADER DOES NOT) */}
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatRef}
            data={messages}
            inverted
            keyExtractor={(i) => String(i._id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />

          {isEditingMode && (
            <View style={styles.editBanner}>
              <Text>Editing message</Text>
              <Pressable onPress={() => setIsEditingMode(false)}>
                <Ionicons name="close" size={18} />
              </Pressable>
            </View>
          )}

          {/* INPUT */}
          <View style={styles.inputBar}>
            <TextInput
              placeholder="Message..."
              placeholderTextColor={COLORS.grey}
              value={text}
              onChangeText={setText}
              style={styles.input}
              multiline
            />
            <TouchableOpacity onPress={handleSend}>
              <Ionicons
                name={isEditingMode ? "checkmark" : "send"}
                size={26}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTION SHEET */}
        <Modal visible={isMenuVisible} transparent animationType="fade">
          <Pressable
            style={sheetStyles.backdrop}
            onPress={() => setMenuVisible(false)}
          >
            <View style={sheetStyles.sheet}>
              <View style={sheetStyles.handle} />

              <Pressable
                style={sheetStyles.actionRow}
                onPress={() => {
                  setIsEditingMode(true);
                  setEditingMessage(menuForMessage);
                  setText(menuForMessage.text);
                  setMenuVisible(false);
                }}
              >
                <Ionicons name="create-outline" size={22} />
                <Text style={sheetStyles.actionText}>Edit Message</Text>
              </Pressable>

              <View style={sheetStyles.divider} />

              <Pressable
                style={sheetStyles.actionRow}
                onPress={async () => {
                  await deleteMessageMut({
                    messageId: menuForMessage._id,
                  });
                  setMenuVisible(false);
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#ff3b30" />
                <Text style={[sheetStyles.actionText, { color: "#ff3b30" }]}>
                  Delete Message
                </Text>
              </Pressable>

              <Pressable
                style={sheetStyles.cancel}
                onPress={() => setMenuVisible(false)}
              >
                <Text style={sheetStyles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: -50
  },

  headerSafe: {
    backgroundColor: COLORS.background,
  },

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
  time: { fontSize: 10, opacity: 0.6, marginTop: 4 },

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
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 22,
    marginRight: 10,
    maxHeight: 120,
  },

  editBanner: {
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },

  image: {
    width: BUBBLE_MAX_WIDTH - 24,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
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
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
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
  },
});
