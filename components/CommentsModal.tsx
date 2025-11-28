import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CommentItem from "./Comment";

/* Responsive helpers */
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export interface CommentType {
  _id: Id<"comments">;
  content: string;
  createdAt: number;
  editedAt?: number;
  parentId?: Id<"comments">;
  user: {
    username: string;
    fullname: string;
    image: string | null;
    _id: Id<"users"> | undefined;
  };
}

type Props = {
  targetId: Id<"posts"> | Id<"marketplacePosts">;
  targetType: "post" | "marketplace";
  visible: boolean;
  onClose: () => void;
  currentUserId?: Id<"users">;
  postOwnerId?: Id<"users">;
  onCommentAdded?: () => void;
};

export default function CommentsModal({
  targetId,
  targetType,
  visible,
  onClose,
  onCommentAdded,
}: Props) {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<null | {
    id: Id<"comments">;
    username: string;
  }>(null);

  const comments: CommentType[] =
    useQuery(api.comments.getComments, { targetId }) ?? [];

  const addComment = useMutation(api.comments.addComment);
  const editComment = useMutation(api.comments.editComment);
  const deleteComment = useMutation(api.comments.deleteComment);

  /* Mention system */
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const mentionList = useQuery(api.users.getMentionUsers);

  useEffect(() => {
    if (mentionList) setMentionUsers(mentionList);
  }, [mentionList]);

  const handleTyping = (text: string) => {
    setNewComment(text);
    if (text.endsWith("@")) setShowMentionList(true);
  };

  const handleSend = async () => {
    if (!newComment.trim()) return;

    await addComment({
      targetId,
      targetType,
      content: newComment,
      parentId: replyTo?.id ?? undefined,
    });

    onCommentAdded?.();

    setNewComment("");
    setReplyTo(null);
    setShowMentionList(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? hp(8) : 0}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={wp(6.5)} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* COMMENT LIST */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{
              padding: wp(4),
              paddingBottom: hp(12),
            }}
            renderItem={({ item }) => (
              <CommentItem
                comment={item}
                onReply={(comment: CommentType) =>
                  setReplyTo({
                    id: comment._id,
                    username: comment.user.username,
                  })
                }
                onEdit={(comment: CommentType, text: string) =>
                  editComment({ commentId: comment._id, text })
                }
                onDelete={(comment: CommentType) =>
                  deleteComment({ commentId: comment._id })
                }
              />
            )}
          />

          {/* REPLY INDICATOR */}
          {replyTo && (
            <View style={styles.replyBanner}>
              <Text style={styles.replyText}>
                Replying to @{replyTo.username}
              </Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons
                  name="close-circle"
                  size={wp(5.5)}
                  color={COLORS.red}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* MENTION LIST */}
          {showMentionList && (
            <View style={styles.mentionList}>
              {mentionUsers.map((u) => (
                <TouchableOpacity
                  key={u._id}
                  style={styles.mentionItem}
                  onPress={() => {
                    setNewComment((prev) => prev + u.username + " ");
                    setShowMentionList(false);
                  }}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={wp(7)}
                    color={COLORS.primary}
                  />
                  <View style={{ marginLeft: wp(2.5) }}>
                    <Text style={styles.mentionName}>{u.fullname}</Text>
                    <Text style={styles.mentionUsername}>@{u.username}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* INPUT BAR */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#6B7280" // darker grey for Android APK
              value={newComment}
              onChangeText={handleTyping}
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={!newComment.trim()}
            >
              <Ionicons
                name="send"
                size={wp(6)}
                color={newComment.trim() ? COLORS.primary : "#bbb"}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

/*───────────────────────────────────────────────
 🔹 RESPONSIVE STYLES
───────────────────────────────────────────────*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* HEADER */
  header: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: "700",
  },

  /* REPLY INFO */
  replyBanner: {
    padding: wp(3),
    backgroundColor: "#eef4ff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  replyText: {
    fontSize: wp(3.7),
    color: COLORS.primary,
    fontWeight: "600",
  },

  /* MENTION LIST */
  mentionList: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: hp(11),
    backgroundColor: "#fff",
    paddingVertical: hp(0.8),
    maxHeight: hp(28),
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(3),
  },
  mentionName: {
    fontSize: wp(3.7),
    fontWeight: "600",
    color: COLORS.text,
  },
  mentionUsername: {
    fontSize: wp(3.2),
    color: "#666",
    marginTop: hp(0.2),
  },

  /* INPUT BAR */
  inputContainer: {
    flexDirection: "row",
    padding: wp(3.5),
    borderTopWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: wp(3.8),
    marginRight: wp(3),
  },
});
