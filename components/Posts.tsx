import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Share } from "react-native";

import {
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useProfileImageCache } from "@/hooks/useProfileImageCache";
import { useRouter } from "expo-router";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import Toast from "react-native-toast-message";
import CommentsModal from "./CommentsModal";

interface PostData {
  _id: Id<"posts">;
  title: string;
  caption?: string;
  category?: string;
  imageUrl?: string;
  isLiked?: boolean;
  likes: number;
  comments: number;
  author: { username: string; image?: string; _id: Id<"users"> }; // ← ADD _id
  eventDate?: string;
  location?: string;
  isOwner?: boolean;
  _creationTime?: number;
  tags?: string[];
}

interface PostProps {
  post: PostData;
  onDeleted?: (postId: Id<"posts">) => void;
}

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

// Category meta info
const CATEGORY_META: Record<string, { icon: string }> = {
  Hackathon: { icon: "🚀" },
  Placements: { icon: "👨‍💼" },
  Workshops: { icon: "🛠️" },
  Festivals: { icon: "🎉" },
  Sports: { icon: "🏅" },
  Other: { icon: "✨" },
};

export default function Post({ post, onDeleted }: PostProps) {
  const router = useRouter();

  // current user id (optional) — use undefined when no user is available
  const currentUserId: Id<"users"> | undefined = undefined;

  // -------------------------------------------------
  // 1. CACHE BUSTER – updates the avatar instantly
  // -------------------------------------------------
  const cacheBuster = useProfileImageCache(post.author._id);

  const toggleLike = useMutation(api.posts.toggleLikePost);
  const toggleBookmark = useMutation(api.bookmark.toggleBookmark);
  const deletePostMutation = useMutation(api.posts.deletePost);
  const [timeAgo, setTimeAgo] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<Id<"posts"> | null>(
    null
  );

  const bookmarks = useQuery(api.bookmark.getBookmarks);

  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes ?? 0);
  const [commentsCount, setCommentsCount] = useState(post.comments ?? 0);

  const [isBookmarked, setIsBookmarked] = useState(false);

  // ─── Sync states ─────────────────────
  useEffect(() => {
    setIsLiked(post.isLiked ?? false);
    setLikesCount(post.likes ?? 0);
    if (bookmarks) {
      const found = bookmarks.some((b: any) => b._id === post._id);
      setIsBookmarked(found);
    }
  }, [post.isLiked, post.likes, bookmarks]);

  // ─── Like ─────────────────────────────────────
  const handleLike = useCallback(async () => {
    try {
      const optimistic = !isLiked;
      setIsLiked(optimistic);
      setLikesCount((c) => (optimistic ? c + 1 : Math.max(0, c - 1)));

      const ok = await toggleLike({ postId: post._id });
      if (ok === false) {
        setIsLiked(isLiked);
        setLikesCount(post.likes ?? 0);
        Toast.show({
          type: "info",
          text1: "You can’t like your own post",
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [isLiked, post._id, toggleLike, post.likes]);

  // ─── Bookmark ─────────────────────────────────
  const handleBookmark = useCallback(async () => {
    try {
      const result = await toggleBookmark({ postId: post._id });
      setIsBookmarked(result);
      Toast.show({
        type: result ? "success" : "info",
        text1: result ? "Added to bookmarks" : "Removed from bookmarks",
        position: "bottom",
        visibilityTime: 1500,
      });
    } catch (e) {
      console.error(e);
    }
  }, [post._id, toggleBookmark]);

  const actionSheetRef = useRef<ActionSheetRef>(null);
  const openOptions = () => actionSheetRef.current?.show();

  const confirmDelete = async () => {
    Alert.alert(
      "Delete Post",
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
                text1: "Post deleted!",
                position: "bottom",
              });
              onDeleted?.(post._id);
            } catch (err: any) {
              Toast.show({
                type: "error",
                text1: "Failed",
                text2: err?.message,
                position: "bottom",
              });
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    actionSheetRef.current?.hide();

    router.push({
      pathname: "/edit-post",
      params: {
        postId: post._id,
      },
    });
  };

  // ─── Time ago ─────────────────────────────────
  useEffect(() => {
    const update = () => {
      setTimeAgo(
        formatDistanceToNow(new Date(post._creationTime || Date.now()), {
          addSuffix: true,
        })
      );
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [post._creationTime]);

  // -------------------------------------------------
  // 2. AVATAR – use cache‑buster in the URL
  // -------------------------------------------------
  const avatarUri = post.author.image
    ? `${post.author.image}?t=${cacheBuster}`
    : "https://i.pravatar.cc/300";

  const handleShare = async () => {
    try {
      const postUrl = `https://campusconnect.app/post/${post._id}`;
      // 🔼 Replace with your web URL if different

      await Share.share({
        message: `${post.title}\n\n${post.caption ?? ""}\n\nCheck it out: ${postUrl}`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          activeOpacity={0.7}
          onPress={() => {
            // If your own post → go to Profile screen
            if (post.isOwner) {
              router.push("/profile");
            } else {
              router.push({
                pathname: "/other-profile",
                params: {
                  userId: post.author._id, // Convex user ID
                },
              });
            }
          }}
        >
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
        </TouchableOpacity>

        {post.isOwner && (
          <TouchableOpacity onPress={openOptions} style={styles.threeDotButton}>
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}

        {post.category && (
          <View style={styles.categoryTag}>
            <LinearGradient
              colors={["#4F9DFF", "#2E6CF3"]}
              style={styles.categoryBadge}
            >
              <Text style={styles.categoryEmoji}>
                {CATEGORY_META[post.category]?.icon ?? "✨"}
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
            <Text
              style={styles.readMore}
              onPress={() =>
                router.push({
                  pathname: "/post-details",
                  params: { postId: post._id },
                })
              }
            >
              Read more
            </Text>
          )}
        </Text>
      )}

      {/* TAGS */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, i) => (
            <View key={i} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
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
        <TouchableOpacity onPress={handleLike} style={styles.actionItem}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={isLiked ? 22 : 20}
            color={isLiked ? COLORS.red : COLORS.textSecondary}
          />
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>

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

      {/* Modals */}
      <CommentsModal
        targetId={post._id}
        targetType="post"
        visible={showComments}
        onClose={() => setShowComments(false)}
        currentUserId={currentUserId}
        postOwnerId={post.author._id} // <-- IMPORTANT for delete permission UI
        onCommentAdded={() => setCommentsCount((c) => c + 1)} // optimistic update
      />

      {/* Action sheet */}
      <ActionSheet ref={actionSheetRef} gestureEnabled>
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Post Options</Text>

          <TouchableOpacity
            style={styles.sheetOption}
            onPress={() => {
              handleEdit();
            }}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sheetText}>Edit Post</Text>
          </TouchableOpacity>

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

/* ─── Styles (unchanged) ─────────────────────────────────────────── */
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
  threeDotButton: { padding: 6, alignSelf: "flex-start" },
  categoryTag: { position: "absolute", top: wp(0), right: wp(6) },
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
  categoryEmoji: { fontSize: wp(3.2), marginRight: wp(1.2) },
  categoryText: { fontSize: wp(3.2), color: COLORS.white, fontWeight: "600" },
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
  metaItem: { flexDirection: "row", alignItems: "center", gap: wp(1.5) },
  metaText: { fontSize: wp(3.4), color: COLORS.textSecondary },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: wp(2.5),
    justifyContent: "space-between",
    gap: wp(5),
  },
  actionItem: { flexDirection: "row", alignItems: "center", gap: wp(1) },
  bookmarkButton: { marginLeft: "auto" },
  actionText: { fontSize: wp(3.4), fontWeight: "500", color: COLORS.text },
  sheetContainer: { padding: wp(5), backgroundColor: COLORS.surface },
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
  sheetText: { fontSize: wp(3.8), color: COLORS.text, fontWeight: "500" },
  readMore: { color: COLORS.primary, fontWeight: "600" },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: wp(3),
    gap: wp(2),
  },

  tagChip: {
    backgroundColor: "#eef4ff",
    paddingHorizontal: wp(2.5),
    paddingVertical: wp(1),
    borderRadius: wp(5),
    borderWidth: 1,
    borderColor: COLORS.secondary + "40",
  },

  tagText: {
    fontSize: wp(3.2),
    fontWeight: "600",
    color: COLORS.primary,
  },
});
