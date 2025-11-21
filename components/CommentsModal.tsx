import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CommentItem from "./Comment";

/*───────────────────────────────────────────────
 🔹 Comment Type
───────────────────────────────────────────────*/
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
  currentUserId,
  postOwnerId,
  onCommentAdded,
}: Props) {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<null | { id: Id<"comments">; username: string }>(null);

  // Load top-level comments
  const comments: CommentType[] =
    useQuery(api.comments.getComments, { targetId }) ?? [];

  // Mutations
  const addComment = useMutation(api.comments.addComment);
  const editComment = useMutation(api.comments.editComment);
  const deleteComment = useMutation(api.comments.deleteComment);

  /*───────────────────────────────────────────────
   🔹 Mentions: followers + following
  ───────────────────────────────────────────────*/
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);

  const mentionList = useQuery(api.users.getMentionUsers);

  useEffect(() => {
    if (mentionList) setMentionUsers(mentionList);
  }, [mentionList]);

  // Detect "@" and open mention list
  const handleTyping = (text: string) => {
    setNewComment(text);

    if (text.endsWith("@")) {
      setShowMentionList(true);
    }
  };

  /*───────────────────────────────────────────────
   🔹 SEND COMMENT OR REPLY
  ───────────────────────────────────────────────*/
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
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* COMMENT LIST */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <CommentItem
                comment={item}
                onReply={(comment: CommentType) =>
                  setReplyTo({ id: comment._id, username: comment.user.username })
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

          {/* REPLY BANNER */}
          {replyTo && (
            <View style={styles.replyBanner}>
              <Text style={styles.replyText}>Replying to @{replyTo.username}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close-circle" size={20} color={COLORS.red} />
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
                    setNewComment(prev => prev + u.username + " ");
                    setShowMentionList(false);
                  }}
                >
                  <Ionicons name="person-circle-outline" size={26} color={COLORS.primary} />
                  <View style={{ marginLeft: 10 }}>
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
              value={newComment}
              onChangeText={handleTyping}
            />

            <TouchableOpacity onPress={handleSend} disabled={!newComment.trim()}>
              <Ionicons
                name="send"
                size={24}
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
 🔹 STYLES
───────────────────────────────────────────────*/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },

  replyBanner: {
    padding: 10,
    backgroundColor: "#eef4ff",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  replyText: { color: COLORS.primary, fontWeight: "500" },

  mentionList: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 70,
    backgroundColor: "#fff",
    paddingVertical: 6,
    maxHeight: 220,
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  mentionName: { fontSize: 14, fontWeight: "600" },
  mentionUsername: { fontSize: 12, color: "#666" },

  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
    alignItems: "center",
  },

  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 10,
  },
});
