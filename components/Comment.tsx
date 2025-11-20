import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

/*───────────────────────────────────────────────
 🔹 Comment Type (must match CommentsModal)
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
    _id: Id<"users"> | undefined;  // ✅ MATCH CommentsModal
  };
}


type Props = {
  comment: CommentType;
  onReply: (c: CommentType) => void;
  onEdit: (c: CommentType, text: string) => void;
  onDelete: (c: CommentType) => void;
};

export default function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
}: Props) {
  const replies: CommentType[] =
    useQuery(api.comments.getReplies, { parentId: comment._id }) ?? [];

  return (
    <View style={{ marginBottom: 18 }}>
      {/* MAIN COMMENT */}
      <View style={styles.row}>
        <Image
          source={
            comment.user.image
              ? { uri: comment.user.image }
              : require("@/assets/images/default-avatar.png")
          }
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {comment.user.fullname || comment.user.username}
          </Text>

          <Text style={styles.text}>{comment.content}</Text>

          {/* ACTIONS */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onReply(comment)}>
              <Text style={styles.reply}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert("Edit Comment", "", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Edit",
                    onPress: () => onEdit(comment, comment.content),
                  },
                ])
              }
            >
              <Text style={styles.reply}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onDelete(comment)}>
              <Text style={[styles.reply, { color: COLORS.red }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* REPLIES */}
      {replies.map((r) => (
        <View key={r._id} style={styles.replyRow}>
          <Image
            source={
              r.user.image
                ? { uri: r.user.image }
                : require("@/assets/images/default-avatar.png")
            }
            style={styles.replyAvatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {r.user.fullname || r.user.username}
            </Text>
            <Text style={styles.text}>{r.content}</Text>

            <TouchableOpacity onPress={() => onReply(r)}>
              <Text style={styles.reply}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  name: { fontWeight: "700", fontSize: 14 },
  text: { marginTop: 2, fontSize: 14 },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 6,
  },
  reply: {
    color: COLORS.primary,
    fontSize: 12,
  },
  replyRow: {
    flexDirection: "row",
    marginTop: 8,
    marginLeft: 50,
    gap: 10,
  },
  replyAvatar: { width: 32, height: 32, borderRadius: 16 },
});
