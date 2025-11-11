// Post.tsx
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import CommentsModal from "./CommentsModal";

interface PostProps {
  post: {
    _id: Id<"posts">;
    title: string;
    caption?: string;
    category?: string;
    imageUrl?: string;
    isLiked?: boolean;
    likes: number;
    createdAt?: string;
    comments: number;
    author: { username: string; image?: string };
    eventDate?: string;
    location?: string;
  };
}

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

export default function Post({ post }: PostProps) {
  const toggleLike = useMutation(api.posts.toggleLikePost);

  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes ?? 0);
  const [commentsCount, setCommentsCount] = useState(post.comments ?? 0);
  const [showComments, setShowComments] = useState(false);

  // 👇 keep local UI in sync with backend updates
  useEffect(() => {
    setIsLiked(post.isLiked ?? false);
    setLikesCount(post.likes ?? 0);
  }, [post.isLiked, post.likes]);

  const handleLike = useCallback(async () => {
    try {
      const optimisticLiked = !isLiked;
      setIsLiked(optimisticLiked);
      setLikesCount((prev) =>
        optimisticLiked ? prev + 1 : Math.max(0, prev - 1)
      );

      const result = await toggleLike({ postId: post._id });

      // 👇 If backend returns false, undo optimistic UI change
      if (result === false) {
        setIsLiked(isLiked);
        setLikesCount(post.likes ?? 0);

        Toast.show({
          type: "info",
          text1: "You can’t like your own post 😅",
          text2: "That’s a bit too much self-love!",
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (error: any) {
      // 👇 If backend throws error (e.g. self-like restriction)
      if (error.message?.includes("own post")) {
        // revert optimistic UI
        setIsLiked(isLiked);
        setLikesCount(post.likes ?? 0);
        return;
      }
      console.error("Error toggling like:", error);
    }
  }, [isLiked, post._id, toggleLike, post.likes]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {post.author.image ? (
            <Image source={{ uri: post.author.image }} style={styles.avatar} />
          ) : (
            <View
              style={[styles.avatar, { backgroundColor: COLORS.grey + "30" }]}
            />
          )}
          <View>
            <Text style={styles.username}>{post.author.username}</Text>
            <Text style={styles.timeAgo}>2d ago</Text>
          </View>
        </View>

        {post.category && (
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.categoryBadge}
          >
            <Ionicons name="bookmark-outline" size={12} color={COLORS.white} />
            <Text style={styles.categoryText}>{post.category}</Text>
          </LinearGradient>
        )}
      </View>

      <Text style={styles.title}>{post.title}</Text>
      {post.caption && (
        <Text style={styles.description} numberOfLines={3}>
          {post.caption}
        </Text>
      )}

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.image} />
      )}

      {(post.eventDate || post.location) && (
        <View style={styles.metaRow}>
          {post.eventDate && (
            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>{post.eventDate}</Text>
            </View>
          )}
          {post.location && (
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>{post.location}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* ❤️ Like */}
        <TouchableOpacity onPress={handleLike} style={styles.actionItem}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={isLiked ? 22 : 20}
            color={isLiked ? COLORS.red : COLORS.textSecondary}
          />
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>

        {/* 💬 Comments */}
        <TouchableOpacity
          onPress={() => setShowComments(true)}
          style={styles.actionItem}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>

        <Text style={styles.timeAgo}>2 hours ago</Text>
      </View>

      {/* Comments Modal */}
      <CommentsModal
        postId={post._id}
        visible={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
      />
    </View>
  );
}

// (Your same styles here)

// ─── Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: wp(4),
    marginVertical: wp(2.5),
    marginHorizontal: wp(4),
    padding: wp(4),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: wp(3),
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    marginRight: wp(2.5),
  },
  username: {
    fontSize: wp(3.9),
    fontWeight: "700",
    color: COLORS.text,
  },
  timeAgo: {
    fontSize: wp(3),
    color: COLORS.textSecondary,
  },

  // Category badge
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2.2),
    paddingVertical: wp(1),
    borderRadius: wp(5),
  },
  categoryText: {
    fontSize: wp(3),
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Title and description
  title: {
    fontSize: wp(4.5),
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: wp(1),
  },
  description: {
    fontSize: wp(3.7),
    color: COLORS.textSecondary,
    lineHeight: wp(5),
    marginBottom: wp(3),
  },

  // Image
  image: {
    width: "100%",
    height: wp(55),
    borderRadius: wp(3),
    marginBottom: wp(3),
  },

  // Metadata (date/location)
  metaRow: {
    flexDirection: "row",
    marginBottom: wp(3),
    alignItems: "center",
    gap: wp(4),
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
  },
  metaText: {
    fontSize: wp(3.4),
    color: COLORS.textSecondary,
  },

  // Interaction actions
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: wp(2.5),
    gap: wp(6),
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
  },
  actionText: {
    fontSize: wp(3.4),
    fontWeight: "500",
    color: COLORS.text,
  },
});
