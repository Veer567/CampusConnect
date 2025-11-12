import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import Toast from "react-native-toast-message";
import CommentsModal from "./CommentsModal";
import PostDetailsModal from "./PostDetailsModal";

interface PostData {
  _id: Id<"posts">;
  title: string;
  caption?: string;
  category?: string;
  imageUrl?: string;
  isLiked?: boolean;
  likes: number;
  comments: number;
  author: { username: string; image?: string };
  eventDate?: string;
  location?: string;
  isOwner?: boolean;
  _creationTime?: number; // ✅ fixed (was string before)
}

interface PostProps {
  post: PostData;
  // onDeleted is a separate prop (not inside post)
  onDeleted?: (postId: Id<"posts">) => void;
}

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

export default function Post({ post, onDeleted }: PostProps) {
  const toggleLike = useMutation(api.posts.toggleLikePost);
  const toggleBookmark = useMutation(api.bookmark.toggleBookmark);
  const deletePostMutation = useMutation(api.posts.deletePost);
  const [timeAgo, setTimeAgo] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  // 👇 Load current bookmarks to check if this post is bookmarked
  const bookmarks = useQuery(api.bookmark.getBookmarks);

  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes ?? 0);
  const [commentsCount, setCommentsCount] = useState(post.comments ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // ─── Sync liked/bookmarked states ─────────────────────
  useEffect(() => {
    setIsLiked(post.isLiked ?? false);
    setLikesCount(post.likes ?? 0);

    // Check if this post is bookmarked
    if (bookmarks) {
      const found = bookmarks.some((b: any) => b._id === post._id);
      setIsBookmarked(found);
    }
  }, [post.isLiked, post.likes, bookmarks]);

  // ─── Like Handler ─────────────────────────────────────
  const handleLike = useCallback(async () => {
    try {
      const optimisticLiked = !isLiked;
      setIsLiked(optimisticLiked);
      setLikesCount((prev) =>
        optimisticLiked ? prev + 1 : Math.max(0, prev - 1)
      );

      const result = await toggleLike({ postId: post._id });

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
      console.error("Error toggling like:", error);
    }
  }, [isLiked, post._id, toggleLike, post.likes]);

  // ─── Bookmark Handler ─────────────────────────────────
  const handleBookmark = useCallback(async () => {
    try {
      const result = await toggleBookmark({ postId: post._id });
      setIsBookmarked(result);

      Toast.show({
        type: result ? "success" : "info",
        text1: result ? "Added to bookmarks 📑" : "Removed from bookmarks ❌",
        position: "bottom",
        visibilityTime: 1500,
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  }, [post._id, toggleBookmark]);

  const actionSheetRef = useRef<ActionSheetRef>(null);

  const openOptions = () => {
    actionSheetRef.current?.show();
  };

  // --- Delete confirmation alert (with improved UI text)
  const confirmDelete = async () => {
    Alert.alert(
      "Delete Post 🗑️",
      "Are you sure you want to permanently delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePostMutation({ postId: post._id });
              Toast.show({
                type: "success",
                text1: "Post deleted successfully!",
                position: "bottom",
                visibilityTime: 1600,
              });
              if (onDeleted) onDeleted(post._id);
            } catch (err: unknown) {
              const message =
                (err as any)?.message ?? String(err ?? "Unknown error");
              Toast.show({
                type: "error",
                text1: "Failed to delete post",
                text2: message,
                position: "bottom",
                visibilityTime: 2000,
              });
            }
          },
        },
      ]
    );
  };

  // --- Handle Edit Post option
  const handleEdit = () => {
    Toast.show({
      type: "info",
      text1: "Edit post feature coming soon 🛠️",
      position: "bottom",
      visibilityTime: 1500,
    });
  };

  // Readable time ago

  useEffect(() => {
    const updateTime = () => {
      setTimeAgo(
        formatDistanceToNow(new Date(post._creationTime || Date.now()), {
          addSuffix: true,
        })
      );
    };
    updateTime(); // initial
    const interval = setInterval(updateTime, 60000); // every 1 minute
    return () => clearInterval(interval);
  }, [post._creationTime]);

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
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </View>

        {post.isOwner && (
          <TouchableOpacity
            onPress={openOptions}
            style={styles.threeDotButton}
            accessibilityLabel="Post options"
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Category badge moved below username */}
        {post.category && (
          <View style={styles.categoryTag}>
            <LinearGradient
              colors={["#4F9DFF", "#2E6CF3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryBadge}
            >
              <Text style={styles.categoryEmoji}>
                {post.category === "Hackathon"
                  ? "🚀"
                  : post.category === "Placements"
                    ? "👨‍💼"
                    : post.category === "Workshops"
                      ? "🛠️"
                      : post.category === "Festivals"
                        ? "🎉"
                        : post.category === "Sports"
                          ? "🏅"
                          : "✨"}
              </Text>
              <Text style={styles.categoryText}>{post.category}</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{post.title}</Text>

      {post.caption && (
        <Text style={styles.description}>
          {post.caption.length > 120
            ? `${post.caption.substring(0, 120)}... `
            : post.caption}
          {post.caption.length > 120 && (
            <Text style={styles.readMore} onPress={() => setShowDetails(true)}>
              Read more
            </Text>
          )}
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

        {/* 🔖 Bookmark (Right end) */}
        <TouchableOpacity
          onPress={handleBookmark}
          style={styles.bookmarkButton}
        >
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isBookmarked ? COLORS.primary : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <CommentsModal
        postId={post._id}
        visible={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
      />

      <PostDetailsModal
        visible={showDetails}
        onClose={() => setShowDetails(false)}
        post={{
          title: post.title,
          caption: post.caption,
          imageUrl: post.imageUrl,
          eventDate: post.eventDate,
          location: post.location,
          likes: likesCount,
          comments: commentsCount,
          isLiked,
          isBookmarked,
          handleLike,
          handleBookmark,
          openComments: () => setShowComments(true),
        }}
      />

      <ActionSheet ref={actionSheetRef} gestureEnabled>
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Post Options</Text>

          {/* ✏️ Edit Post */}
          <TouchableOpacity
            style={styles.sheetOption}
            onPress={() => {
              handleEdit();
              actionSheetRef.current?.hide();
            }}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sheetText}>Edit Post</Text>
          </TouchableOpacity>

          {/* 🗑️ Delete Post */}
          <TouchableOpacity
            style={styles.sheetOption}
            onPress={() => {
              actionSheetRef.current?.hide();
              confirmDelete();
            }}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            <Text style={[styles.sheetText, { color: COLORS.red }]}>
              Delete Post
            </Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: wp(1.5),
    marginVertical: wp(2.5),
    marginHorizontal: wp(4),
    padding: wp(3.5),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 5, height: 4 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: wp(3),
    position: "relative",
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
  categoryWrapper: {
    position: "absolute",
    top: wp(2),
    right: wp(8), // 👈 adds spacing so it doesn’t clash with 3 dots
    zIndex: 2,
  },
  threeDotButton: {
    padding: 6,
    alignSelf: "flex-start",
  },

  // Moved category tag below username
  categoryTag: {
    position: "absolute",
    top: wp(0), // below username
    right: wp(6),
  },

  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2.8),
    paddingVertical: wp(0.8),
    borderRadius: wp(5),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  categoryEmoji: {
    fontSize: wp(3.2),
    marginRight: wp(1.2),
  },

  categoryText: {
    fontSize: wp(3.2),
    color: COLORS.white,
    fontWeight: "600",
  },

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
  image: {
    width: "100%",
    height: wp(55),
    borderRadius: wp(3),
    marginBottom: wp(3),
  },
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: wp(2.5),
    justifyContent: "space-between", // pushes bookmark to right
    gap: wp(5),
  },

  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
  },
  bookmarkButton: {
    marginLeft: "auto", // ensures it stays on the right edge
  },

  actionText: {
    fontSize: wp(3.4),
    fontWeight: "500",
    color: COLORS.text,
  },

  sheetContainer: {
    padding: wp(5),
    backgroundColor: COLORS.surface,
  },
  sheetTitle: {
    fontSize: wp(4),
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: wp(3),
    textAlign: "center",
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: wp(3),
  },
  sheetText: {
    fontSize: wp(3.8),
    color: COLORS.text,
    fontWeight: "500",
  },
  readMore: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
