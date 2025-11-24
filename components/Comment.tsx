import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { COLORS } from "@/constants/themes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/* Responsive helpers */
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

/* Comment type (same as CommentsModal) */
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
  comment: CommentType;
  onReply: (c: CommentType) => void;
  onEdit: (c: CommentType, text: string) => void;
  onDelete: (c: CommentType) => void;
};

export default function CommentItem({ comment, onReply, onEdit, onDelete }: Props) {
  const replies: CommentType[] =
    useQuery(api.comments.getReplies, { parentId: comment._id }) ?? [];

  return (
    <View style={{ marginBottom: hp(2.2) }}>
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
                  { text: "Edit", onPress: () => onEdit(comment, comment.content) },
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

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: wp(3),
  },

  avatar: {
    width: wp(10),      // 40px → responsive
    height: wp(10),
    borderRadius: wp(5),
  },

  name: {
    fontWeight: "700",
    fontSize: wp(3.8),
  },

  text: {
    marginTop: hp(0.5),
    fontSize: wp(3.7),
    lineHeight: wp(4.8),
    color: "#222",
  },

  actions: {
    flexDirection: "row",
    gap: wp(5),
    marginTop: hp(0.9),
  },

  reply: {
    color: COLORS.primary,
    fontSize: wp(3.2),
  },

  replyRow: {
    flexDirection: "row",
    marginTop: hp(1),
    marginLeft: wp(13), // 50px → responsive
    gap: wp(3),
  },

  replyAvatar: {
    width: wp(8),     // 32px → responsive
    height: wp(8),
    borderRadius: wp(4),
  },
});
