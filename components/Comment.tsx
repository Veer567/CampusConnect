import { View, Text, Image } from "react-native";
import React from "react";
import { formatDistanceToNow } from "date-fns";

interface CommentProps {
  content: string;
  _creationTime: number;
  user: {
    username: string;
    image?: string | null;
  };
}

export default function Comment({ comment }: { comment: CommentProps }) {
  const displayImage = comment.user.image
    ? { uri: comment.user.image }
    : require("@/assets/images/default-avatar.png");

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
      <Image
        source={displayImage}
        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "bold" }}>
          {comment.user.username || "UnknownUser"}
        </Text>
        <Text>{comment.content}</Text>
        <Text style={{ color: "gray", fontSize: 12 }}>
          {formatDistanceToNow(comment._creationTime, { addSuffix: true })}
        </Text>
      </View>
    </View>
  );
}
