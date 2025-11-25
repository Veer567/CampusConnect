// app/post-details.tsx
import { Loader } from "@/components/Loader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export default function PostDetailsScreen() {
  const router = useRouter();
  const { postId, scrollTo, from } = useLocalSearchParams();

  // Normalize ID
  const normalizedPostId = Array.isArray(postId) ? postId[0] : postId;

  // Fetch post
  const post = useQuery(
    api.posts.getPostById,
    normalizedPostId ? { postId: normalizedPostId as Id<"posts"> } : "skip"
  );

  // Fetch comments (Convex getComments)
  const comments =
    useQuery(
      api.comments.getComments,
      normalizedPostId
        ? { targetId: normalizedPostId as Id<"posts"> }
        : "skip"
    ) ?? [];

  // Mutations
  const toggleLike = useMutation(api.posts.toggleLikePost);
  const toggleBookmark = useMutation(api.posts.toggleBookmark);
  const addComment = useMutation(api.comments.addComment);
  const deleteComment = useMutation(api.comments.deleteComment);

  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<any>(null);

  // Fade-in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, []);

  // Auto scroll when clicking comment notification
  useEffect(() => {
    if (scrollTo === "comments") {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [scrollTo, comments]);

  if (!post) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
       <Loader />
      </SafeAreaView>
    );
  }

  // LIKE
  const handleLike = () => {
    toggleLike({ postId: post._id });
  };

  // BOOKMARK
  const handleBookmark = () => {
    toggleBookmark({ postId: post._id });
  };

  // SEND COMMENT / REPLY
  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text) return;

    await addComment({
      targetId: post._id,
      targetType: "post",
      content: text,
      parentId: replyTarget ? replyTarget._id : undefined,
    });

    setCommentText("");
    setReplyTarget(null);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  // DELETE COMMENT
  const confirmDelete = (c: any) => {
    Alert.alert("Delete comment?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteComment({ commentId: c._id });
        },
      },
    ]);
  };

  // BACK BUTTON LOGIC
  const handleBack = () => {
    if (from === "likes") {
      router.push("/profile"); // ← BACK TO PROFILE
    } else {
      router.back();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background Blur */}
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.35)"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [
            {
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1],
              }),
            },
          ],
        }}
      >
        <SafeAreaView style={styles.cardContainer}>
          <StatusBar translucent barStyle="light-content" />

          {/* BACK BUTTON */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color={COLORS.text} />
          </TouchableOpacity>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* POST TITLE */}
            <Text style={styles.title}>{post.title}</Text>

            {/* POST IMAGE */}
            {post.imageUrl && (
              <Image source={{ uri: post.imageUrl }} style={styles.image} />
            )}

            {/* ACTIONS */}
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
                <Ionicons
                  name={post.isLiked ? "heart" : "heart-outline"}
                  size={26}
                  color={post.isLiked ? COLORS.red : COLORS.textSecondary}
                />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleBookmark}
                style={styles.actionBtn}
              >
                <Ionicons
                  name={post.isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={25}
                  color={
                    post.isBookmarked ? COLORS.primary : COLORS.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>

            {/* CAPTION */}
            {post.caption && (
              <Text style={styles.caption}>{post.caption}</Text>
            )}

            {/* META */}
            {(post.eventDate || post.location) && (
              <View style={styles.metaCard}>
                {post.eventDate && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.metaText}>{post.eventDate}</Text>
                  </View>
                )}

                {post.location && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.metaText}>{post.location}</Text>
                  </View>
                )}
              </View>
            )}

            {/* COMMENTS TITLE */}
            <Text style={styles.commentsTitle}>Comments</Text>

            {/* COMMENTS LIST */}
            {comments.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary }}>
                No comments yet — be the first!
              </Text>
            ) : (
              comments.map((c) => <CommentBlock key={c._id} c={c} onReply={(cm)=>setReplyTarget(cm)} onDelete={confirmDelete} />)
            )}

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* COMMENT INPUT */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.commentInputWrap}
          >
            {replyTarget && (
              <Text style={styles.replyingTo}>
                Replying to @{replyTarget.user.username}
              </Text>
            )}
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              style={styles.input}
            />
            <TouchableOpacity onPress={handleSendComment} style={styles.sendBtn}>
              <Ionicons name="send" size={22} color="white" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

/* ----------------------------------------------
   COMMENT BLOCK COMPONENT
---------------------------------------------- */
function CommentBlock({
  c,
  onReply,
  onDelete,
}: {
  c: any;
  onReply: (comment: any) => void;
  onDelete: (comment: any) => void;
}) {
  const replies =
    useQuery(api.comments.getReplies, { parentId: c._id }) ?? [];

  return (
    <View style={{ marginBottom: hp(2) }}>
      {/* MAIN COMMENT */}
      <View style={styles.commentRow}>
        <Ionicons name="person-circle" size={36} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.commentUser}>{c.user?.username}</Text>
          <Text style={styles.commentText}>{c.content}</Text>

          <View style={styles.commentActions}>
            <TouchableOpacity onPress={() => onReply(c)}>
              <Text style={styles.replyBtn}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onDelete(c)}>
              <Text style={[styles.replyBtn, { color: COLORS.red }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* REPLIES */}
      {replies.map((r) => (
        <View key={r._id} style={styles.replyRow}>
          <Ionicons name="person-circle" size={28} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.commentUser}>{r.user?.username}</Text>
            <Text style={styles.commentText}>{r.content}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ----------------------------------------------
   STYLES
---------------------------------------------- */
const styles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  cardContainer: { flex: 1, backgroundColor: COLORS.surface },

  backButton: {
    position: "absolute",
    top: hp(2.5),
    left: wp(4),
    zIndex: 50,
    backgroundColor: "#fff",
    padding: wp(2),
    borderRadius: 50,
  },

  scrollContent: {
    paddingTop: hp(10),
    paddingHorizontal: wp(6),
    paddingBottom: hp(5),
  },

  title: {
    fontSize: wp(6),
    fontWeight: "800",
    textAlign: "center",
    marginBottom: wp(4),
    color: COLORS.text,
  },

  image: {
    width: "100%",
    height: hp(33),
    borderRadius: wp(4),
    marginBottom: wp(4),
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(8),
    marginBottom: wp(5),
  },

  actionBtn: { flexDirection: "row", alignItems: "center", gap: wp(2) },
  actionText: { color: COLORS.textSecondary, fontSize: wp(4) },

  caption: {
    fontSize: wp(4),
    lineHeight: wp(6),
    color: COLORS.textSecondary,
    marginBottom: wp(4),
  },

  metaCard: {
    backgroundColor: COLORS.background,
    padding: wp(4),
    borderRadius: wp(4),
    borderColor: COLORS.border,
    borderWidth: 1,
    marginBottom: wp(5),
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: wp(2),
    gap: wp(3),
  },

  metaText: { color: COLORS.textSecondary, fontSize: wp(4) },

  commentsTitle: {
    fontSize: wp(5),
    fontWeight: "700",
    marginBottom: wp(4),
  },

  commentRow: {
    flexDirection: "row",
    gap: wp(4),
  },

  commentUser: { fontWeight: "700", fontSize: wp(4) },

  commentText: { color: COLORS.textSecondary, fontSize: wp(3.7) },

  commentActions: {
    flexDirection: "row",
    gap: wp(6),
    marginTop: hp(0.8),
  },

  replyBtn: { color: COLORS.primary, fontSize: wp(3.2) },

  replyRow: {
    flexDirection: "row",
    marginLeft: wp(12),
    marginTop: hp(1),
    gap: wp(4),
  },

  commentInputWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(3),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ccc",
  },

  replyingTo: {
    position: "absolute",
    top: -hp(2),
    left: wp(3),
    color: COLORS.primary,
    fontWeight: "600",
  },

  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    padding: wp(3),
    borderRadius: wp(3),
    fontSize: wp(4),
  },

  sendBtn: {
    backgroundColor: COLORS.primary,
    padding: wp(3),
    borderRadius: wp(3),
    marginLeft: wp(3),
  },
});
