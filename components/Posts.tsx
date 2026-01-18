import { useAlert } from "@/components/GlobalAlert";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useToast } from "./Toast/ToastProvider";

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
  author: { username: string; image?: string; _id: Id<"users"> };
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

/* ---------------------------------------------------------
   UNIVERSAL PRESSABLE COMPONENT (INLINE)
--------------------------------------------------------- */
const T = ({ children, onPress, style, disabled = false }: any) => (
  <Pressable
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      style,
      pressed ? { opacity: 0.5 } : null, // iOS effect
    ]}
    android_ripple={{ color: "rgba(0,0,0,0.15)" }}
  >
    {children}
  </Pressable>
);

// Category icons
export const categories = [
  {
    id: 0,
    name: "All",
    icon: <Ionicons name="grid" size={24} color="#a09ce9ff" />, // purple
  },
  {
    id: 1,
    name: "Placements",
    icon: <Ionicons name="briefcase" size={24} color="#FF914D" />, // orange
  },
  {
    id: 2,
    name: "Workshops",
    icon: (
      <MaterialCommunityIcons name="hammer-wrench" size={24} color="#00BFA6" />
    ), // teal
  },
  {
    id: 3,
    name: "Hackathon",
    icon: <Ionicons name="rocket" size={24} color="#FF4F79" />, // pink-red
  },
  {
    id: 4,
    name: "Festivals",
    icon: <Ionicons name="sparkles" size={24} color="#FFD233" />, // gold
  },
  {
    id: 5,
    name: "Sports",
    icon: <Ionicons name="trophy" size={24} color="#2EC4B6" />, // green-teal
  },
  {
    id: 6,
    name: "Other",
    icon: <Ionicons name="ellipsis-horizontal" size={24} color="#8E44AD" />, // purple dark
  },
];

export default function Post({ post, onDeleted }: PostProps) {
  const router = useRouter();
  const alert = useAlert();
  const toast = useToast();

  const currentUserId: Id<"users"> | undefined = undefined;
  const cacheBuster = useProfileImageCache(post.author._id);

  const toggleLike = useMutation(api.posts.toggleLikePost);
  const toggleBookmark = useMutation(api.bookmark.toggleBookmark);
  const deletePostMutation = useMutation(api.posts.deletePost);

  const bookmarks = useQuery(api.bookmark.getBookmarks);

  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments ?? 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [timeAgo, setTimeAgo] = useState("");

  const [showComments, setShowComments] = useState(false);

  const actionSheetRef = useRef<ActionSheetRef>(null);

  /* ---------------------------------------------------------
     Sync likes & bookmarks on update
  --------------------------------------------------------- */
  useEffect(() => {
    setIsLiked(post.isLiked ?? false);
    setLikesCount(post.likes ?? 0);

    if (bookmarks) {
      setIsBookmarked(bookmarks.some((b: any) => b._id === post._id));
    }
  }, [post.isLiked, post.likes, bookmarks]);

  /* ---------------------------------------------------------
     Time ago calculation
  --------------------------------------------------------- */
  useEffect(() => {
    const update = () => {
      setTimeAgo(
        formatDistanceToNow(new Date(post._creationTime || Date.now()), {
          addSuffix: true,
        }),
      );
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [post._creationTime]);

  const handleLike = useCallback(async () => {
    const prev = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prev);
    setLikesCount(prev ? prevCount - 1 : prevCount + 1);

    try {
      const res = await toggleLike({ postId: post._id });

      if (res && post.isOwner) {
        setIsLiked(false);
        setLikesCount(prevCount);
        Toast.show({
          type: "info",
          text1: "You can't like your own post",
        });
      }
    } catch (e) {
      setIsLiked(prev);
      setLikesCount(prevCount);
    }
  }, [isLiked, likesCount]);

  const handleBookmark = useCallback(async () => {
    try {
      const result = await toggleBookmark({ postId: post._id });
      setIsBookmarked(result);
      Toast.show({
        type: result ? "success" : "info",
        text1: result ? "Added to bookmarks" : "Removed from bookmarks",
      });
    } catch {}
  }, []);

  const openOptions = () => actionSheetRef.current?.show();

  const confirmDelete = () => {
    alert.show({
      title: "Delete Post?",
      message:
        "This action cannot be undone. Are you sure you want to delete this post?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await deletePostMutation({ postId: post._id });
          onDeleted?.(post._id);

          toast.show(
            {
              title: "Post Deleted",
              message: "Your post was removed successfully.",
            },
            "success",
          );
        } catch {
          toast.show(
            {
              title: "Delete Failed",
              message: "Unable to delete post. Try again.",
            },
            "error",
          );
        }
      },
      onCancel: () => {},
    });
  };

  const handleEdit = () => {
    actionSheetRef.current?.hide();
    setTimeout(() => {
      router.push({ pathname: "/edit-post", params: { postId: post._id } });
    }, 130);
  };

  const avatarUri = post.author.image
    ? `${post.author.image}?t=${cacheBuster}`
    : "https://i.pravatar.cc/300";

  const refresh = useCallback(() => {
    setCommentsCount((prev) => prev + 1);
  }, []);
  return (
    <View style={styles.card}>
      {/* ---------------------------------- HEADER ---------------------------------- */}
      {/* ---------------- HEADER ---------------- */}
      <View style={styles.header}>
        {/* LEFT: User */}
        <T
          style={styles.userInfo}
          onPress={() =>
            post.isOwner
              ? router.push("/profile")
              : router.push({
                  pathname: "/other-profile",
                  params: { userId: post.author._id },
                })
          }
        >
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View>
            <Text style={styles.username}>{post.author.username}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </T>

        {/* RIGHT: Category + Menu */}
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: wp(3) }}
        >
          {/* Category beside 3-dot */}
          {post.category && (
            <LinearGradient
              colors={["#4F9DFF", "#2E6CF3"]}
              style={styles.categoryBadgeInline}
            >
              <Text style={styles.categoryEmoji}>
                {categories.find((c) => c.name === post.category)?.icon ?? "✨"}
              </Text>
              <Text style={styles.categoryText}>{post.category}</Text>
            </LinearGradient>
          )}

          {/* 3 dot menu */}
          {post.isOwner && (
            <T style={styles.threeDotButton} onPress={openOptions}>
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color={COLORS.textSecondary}
              />
            </T>
          )}
        </View>
      </View>
      {/* ---------------------------------- TITLE ---------------------------------- */}
      <Text style={styles.title}>{post.title}</Text>
      {post.caption && (
        <Text style={styles.description}>
          {post.caption.length > 120
            ? `${post.caption.slice(0, 120)}... `
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
      {/* ---------------------------------- TAGS ---------------------------------- */}
      {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, i) => (
            <View key={`${post._id}-${tag}-${i}`} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* ---------------------------------- IMAGE ---------------------------------- */}
      {post.imageUrl && (
        <T
          onPress={() =>
            router.push({
              pathname: "/post-details",
              params: { postId: post._id },
            })
          }
        >
          <Image source={{ uri: post.imageUrl }} style={styles.image} />
        </T>
      )}
      {/* ---------------------------------- META ---------------------------------- */}
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
      {/* ---------------------------------- ACTIONS ---------------------------------- */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <T style={styles.actionItem} onPress={handleLike}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={22}
              color={isLiked ? COLORS.red : COLORS.textSecondary}
            />
            <Text style={styles.actionText}>{likesCount}</Text>
          </T>

          <T style={styles.actionItem} onPress={() => setShowComments(true)}>
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={COLORS.textSecondary}
            />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </T>
        </View>

        <T style={styles.bookmarkButton} onPress={handleBookmark}>
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isBookmarked ? COLORS.primary : COLORS.textSecondary}
          />
        </T>
      </View>
      {/* ---------------------------------- COMMENTS MODAL ---------------------------------- */}
      <CommentsModal
        targetId={post._id}
        targetType="post"
        visible={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={refresh}
      />
      {/* ---------------------------------- ACTION SHEET ---------------------------------- */}
      <ActionSheet ref={actionSheetRef}>
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Post Options</Text>

          <T style={styles.sheetOption} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sheetText}>Edit Post</Text>
          </T>

          <T style={styles.sheetOption} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            <Text style={[styles.sheetText, { color: COLORS.red }]}>
              Delete Post
            </Text>
          </T>
        </View>
      </ActionSheet>
    </View>
  );
}

/* ---------------------------------------------------------
   STYLES (unchanged)
--------------------------------------------------------- */
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: wp(1.5),
    marginVertical: wp(2.5),
    marginHorizontal: wp(4),
    padding: wp(3.5),
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 5, height: 4 },
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: wp(3),
  },

  userInfo: { flexDirection: "row", alignItems: "center" },

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

  timeAgo: { fontSize: wp(3), color: COLORS.textSecondary },

  threeDotButton: {
    padding: 5,
    marginLeft: -wp(3),
    marginTop: -20,
  },

  categoryBadgeInline: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: -20,
    paddingHorizontal: wp(2.8),
    paddingVertical: wp(0.8),
    borderRadius: wp(5),
    backgroundColor: "#4F9DFF",
    elevation: 2,
  },

  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(3),
    paddingVertical: wp(1),
    borderRadius: wp(5),
    elevation: 2,
  },

  categoryEmoji: { fontSize: wp(1.5), marginRight: wp(1.2) },
  categoryText: { fontSize: wp(2.5), color: "#fff", fontWeight: "600" },

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

  readMore: { color: COLORS.primary, fontWeight: "600" },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: wp(2),
    marginTop: wp(2),
    marginBottom: wp(3),
  },

  tagChip: {
    backgroundColor: "#eef4ff",
    borderColor: COLORS.secondary + "40",
    borderWidth: 1,
    paddingHorizontal: wp(2.5),
    paddingVertical: wp(1),
    borderRadius: wp(5),
  },

  tagText: { fontSize: wp(3.2), fontWeight: "600", color: COLORS.primary },

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

  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(7),
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // <-- THIS FIXES IT
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: wp(2.5),
    marginTop: wp(2),
  },

  bookmarkButton: {
    padding: 4,
  },

  actionItem: { flexDirection: "row", alignItems: "center", gap: wp(1) },

  actionText: {
    fontSize: wp(3.4),
    fontWeight: "500",
    color: COLORS.text,
  },

  sheetContainer: { padding: wp(5), backgroundColor: COLORS.surface },

  sheetTitle: {
    fontSize: wp(4),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: wp(3),
  },

  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: wp(3),
  },

  sheetText: { fontSize: wp(3.8), color: COLORS.text },
});
