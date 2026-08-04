import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";

import type { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useKeepAwake } from "expo-keep-awake";

const { width } = Dimensions.get("window");
const BUBBLE_MAX_WIDTH = width * 0.78;

function isValidConvexId(id?: string | null): boolean {
  if (!id) return false;
  if (id === "undefined" || id === "null" || id.trim() === "") return false;
  return typeof id === "string" && id.length > 5;
}

export default function ChatScreen() {
  useKeepAwake();
  
  const router = useRouter();
  const params = useLocalSearchParams();

  const rawConvId = params.conversationId as string | undefined;
  const rawOtherId = params.otherUserId as string | undefined;

  const validConvParam = isValidConvexId(rawConvId)
    ? (rawConvId as Id<"conversations">)
    : undefined;

  const validOtherId = isValidConvexId(rawOtherId)
    ? (rawOtherId as Id<"users">)
    : undefined;

  const { userId: clerkId } = useAuth();

  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  const meId = me?._id;

  const [activeConvId, setActiveConvId] = useState<Id<"conversations"> | undefined>(validConvParam);

  const getOrStartConv = useMutation(api.chat.getOrStartConversation);

  useEffect(() => {
    if (validConvParam) {
      setActiveConvId(validConvParam);
    } else if (validOtherId && meId && !activeConvId) {
      getOrStartConv({ otherUserId: validOtherId })
        .then((res) => {
          const resolvedId =
            typeof res === "object" && res && "_id" in res
              ? res._id
              : (res as unknown as Id<"conversations">);
          if (resolvedId && isValidConvexId(String(resolvedId))) {
            setActiveConvId(resolvedId as Id<"conversations">);
          }
        })
        .catch(() => {});
    }
  }, [validConvParam, validOtherId, meId]);

  const conversation = useQuery(
    api.chat.getConversation,
    activeConvId && meId ? { conversationId: activeConvId } : "skip"
  );

  const resolvedOtherUserId =
    validOtherId ||
    (meId && conversation
      ? conversation.participants.find((p) => String(p) !== String(meId))
      : undefined);

  /* ---------------- Queries ---------------- */

  const other = useQuery(
    api.users.getUserProfile,
    resolvedOtherUserId ? { id: resolvedOtherUserId } : "skip"
  );

  const presence = useQuery(
    api.chat.getUserPresence,
    resolvedOtherUserId ? { userId: resolvedOtherUserId } : "skip"
  );

  const messages = useQuery(
    api.chat.getMessagesLive,
    activeConvId ? { conversationId: activeConvId } : "skip"
  );

  const typingUsers = useQuery(
    api.chat.getTypingForConversation,
    activeConvId ? { conversationId: activeConvId } : "skip"
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
    (t: any) => String(t.userId) === String(resolvedOtherUserId)
  );

  /* ---------------- Effects ---------------- */

  useFocusEffect(
    useCallback(() => {
      markAllNotificationsRead();
    }, [])
  );

  useEffect(() => {
    if (!messages?.length || !activeConvId) return;
    markRead({ conversationId: activeConvId }).catch(() => {});
    scrollToBottom(false);
  }, [messages, activeConvId]);

  useEffect(() => {
    if (!activeConvId) return;
    if (text.length > 0) startTyping({ conversationId: activeConvId });
    const t = setTimeout(() => stopTyping({ conversationId: activeConvId }), 800);
    return () => clearTimeout(t);
  }, [text, activeConvId]);

  /* ---------------- Helpers ---------------- */

  const scrollToBottom = (animated = true) => {
    InteractionManager.runAfterInteractions(() => {
      flatRef.current?.scrollToOffset({ offset: 0, animated });
    });
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !activeConvId) return;

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
      conversationId: activeConvId,
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
    );
  };

  /* ---------------- UI ---------------- */

  if (!activeConvId || messages === undefined) {
    return (
      <View style={[styles.container, { justifyContent: "flex-start" }]}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="arrow-back" size={26} color={COLORS.text || "#000"} />
            </TouchableOpacity>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.headerName}>
                {other?.fullname || other?.username || "Chat"}
              </Text>
            </View>
          </View>
        </SafeAreaView>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

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
                  params: { userId: resolvedOtherUserId },
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

            <View style={{ marginLeft: 10, flex: 1, marginRight: 10 }}>
              <Text style={styles.headerName} numberOfLines={1} ellipsizeMode="tail">
                {other?.fullname || other?.username}
              </Text>
              <Text style={styles.typingText} numberOfLines={1}>
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
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
        </KeyboardAvoidingView>

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
