import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
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
    _id: Id<"users"> | undefined; // ⭐ Fix here
  };
}

type Props = {
  targetId: Id<"posts"> | Id<"marketplacePosts">;
  targetType: "post" | "marketplace";
  visible: boolean;
  onClose: () => void;

  // ⭐ ADD THESE 3
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
  const [replyTo, setReplyTo] = useState<null | {
    id: Id<"comments">;
    username: string;
  }>(null);

  // Load top-level comments
  const comments: CommentType[] =
    useQuery(api.comments.getComments, { targetId }) ?? [];

  // Mutations
  const addComment = useMutation(api.comments.addComment);
  const editComment = useMutation(api.comments.editComment);
  const deleteComment = useMutation(api.comments.deleteComment);

  /*-------------------------------------------------
      SEND COMMENT / SEND REPLY
  --------------------------------------------------*/
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
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                  setReplyTo({
                    id: comment._id,
                    username: comment.user.username,
                  })
                }
                onEdit={async (comment: CommentType, text: string) =>
                  editComment({ commentId: comment._id, text })
                }
                onDelete={async (comment: CommentType) =>
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
                <Ionicons name="close-circle" size={20} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          )}

          {/* INPUT BAR */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={!newComment.trim()}
            >
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

  replyText: { color: COLORS.primary },

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
