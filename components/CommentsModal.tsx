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
import Comment from "./Comment";
import { Loader } from "./Loader";

type CommentsModalProps = {
  postId: Id<"posts">;
  visible: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
};

export default function CommentsModal({
  postId,
  visible,
  onClose,
  onCommentAdded,
}: CommentsModalProps) {
  const [newComment, setNewComment] = useState("");
  const comments = useQuery(api.comments.getComments, { postId });
  const addComment = useMutation(api.comments.addComments);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment({
        content: newComment,
        postId,
      });
      setNewComment("");
      onCommentAdded();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <View style={styles.commentsSection}>
            {comments === undefined ? (
              <Loader />
            ) : comments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No comments yet. Be the first!
                </Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item._id.toString()}
                renderItem={({ item }) => <Comment comment={item} />}
                contentContainerStyle={styles.commentsList}
              />
            )}
          </View>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor="#999"
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!newComment.trim()}
              style={styles.sendButton}
            >
              <Ionicons
                name="send"
                size={26}
                color={newComment.trim() ? COLORS.primary : "#bbb"}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

/*──────────────────────────────
   🧱 STYLES
──────────────────────────────*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  commentsSection: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: Platform.OS === "ios" ? 14 : 16, // 👈 lifted a bit above bottom
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    backgroundColor: "white",
  },
  sendButton: {
    marginLeft: 10,
  },
});
