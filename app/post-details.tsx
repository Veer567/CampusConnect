// app/post-details.tsx

import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ============================================================
   INLINE SHIMMER SKELETON — No separate file needed
============================================================ */
const Shimmer: React.FC<{
  width?: string | number;
  height?: string | number;
  radius?: number;
  style?: any;
}> = ({ width = "100%", height = 20, radius = 8, style = {} }) => {
  const shimmer = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  return (
    <View
      style={[
        {
          backgroundColor: "#e2e2e2",
          width,
          height,
          borderRadius: radius,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: "100%",
          width: "60%",
          backgroundColor: "rgba(255,255,255,0.45)",
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

//Screen dimensions helpers

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export default function PostDetailsScreen() {
  const router = useRouter();
  const { postId, scrollTo, from } = useLocalSearchParams();

  const normalizedPostId = Array.isArray(postId) ? postId[0] : postId;

  const post = useQuery(
    api.posts.getPostById,
    normalizedPostId ? { postId: normalizedPostId as Id<"posts"> } : "skip"
  );

  const comments =
    useQuery(
      api.comments.getComments,
      normalizedPostId ? { targetId: normalizedPostId as Id<"posts"> } : "skip"
    ) ?? [];

  const toggleLike = useMutation(api.posts.toggleLikePost);
  const toggleBookmark = useMutation(api.posts.toggleBookmark);
  const addComment = useMutation(api.comments.addComment);
  const deleteComment = useMutation(api.comments.deleteComment);

  const scrollRef = useRef<ScrollView>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<any>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (scrollTo === "comments") {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [scrollTo, comments]);

  /* ============================================================
     SKELETON LOADING VIEW
  ============================================================ */

  if (!post) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        {/* Title */}
        <Shimmer
          width="70%"
          height={28}
          radius={6}
          style={{ marginBottom: 20 }}
        />

        {/* Image */}
        <Shimmer
          width="100%"
          height={hp(30)}
          radius={14}
          style={{ marginBottom: 30 }}
        />

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 20, marginBottom: 20 }}>
          <Shimmer width={60} height={30} radius={10} />
          <Shimmer width={40} height={30} radius={10} />
        </View>

        {/* Caption + Meta */}
        <Shimmer width="90%" height={16} style={{ marginBottom: 10 }} />
        <Shimmer width="80%" height={16} style={{ marginBottom: 10 }} />
        <Shimmer width="60%" height={16} style={{ marginBottom: 30 }} />

        {/* Comments Skeleton */}
        <Shimmer width="40%" height={20} style={{ marginBottom: 20 }} />
        <View style={{ gap: 20, width: "100%" }}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12 }}>
              <Shimmer width={40} height={40} radius={20} />
              <View style={{ flex: 1, gap: 10 }}>
                <Shimmer width="40%" height={14} />
                <Shimmer width="75%" height={14} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  /* ============================================================
     MAIN LOGIC
  ============================================================ */

  const handleLike = () => toggleLike({ postId: post._id });
  const handleBookmark = () => toggleBookmark({ postId: post._id });

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

  const handleBack = () => {
    if (from === "likes") router.push("/profile");
    else router.back();
  };

  const confirmDelete = (c: any) => {
    Alert.alert("Delete comment?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteComment({ commentId: c._id }),
      },
    ]);
  };

  const addToGoogleCalendar = () => {
    if (!post.eventDate) return alert("No event date");

    // Convert DD/MM/YYYY → YYYY-MM-DD
    const [day, month, year] = post.eventDate.split("/");
    const formatted = `${year}-${month}-${day}`;

    const eventDateObj = new Date(formatted);
    if (isNaN(eventDateObj.getTime())) {
      return alert("Invalid event date format");
    }

    const startISO = eventDateObj
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d+Z$/, "Z");

    const endObj = new Date(eventDateObj.getTime() + 3600000);
    const endISO = endObj
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d+Z$/, "Z");

    const url =
      "https://www.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(post.title || "Event")}` +
      `&details=${encodeURIComponent(post.caption || "")}` +
      `&location=${encodeURIComponent(post.location || "")}` +
      `&dates=${startISO}/${endISO}`;

    Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1 }}>
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
        <SafeAreaView style={styles.cardContainer} edges={[]}>
          <StatusBar translucent barStyle="light-content" />

          {/* BACK */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color={COLORS.text} />
          </TouchableOpacity>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* TITLE */}
            <Text style={styles.title}>{post.title}</Text>

            {/* IMAGE */}
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
            {post.caption && <Text style={styles.caption}>{post.caption}</Text>}

            {/* META CARD (White box with date + location) */}
            <View
              style={{
                backgroundColor: "#F8F9FB",
                padding: 16,
                borderRadius: 20,
                marginTop: 10,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              {post.eventDate && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#6B7280"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: "#374151", fontSize: 16 }}>
                    {post.eventDate}
                  </Text>
                </View>
              )}

              {post.location && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color="#6B7280"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: "#374151", fontSize: 16 }}>
                    {post.location}
                  </Text>
                </View>
              )}
            </View>

            {/* BLUE ADD TO CALENDAR BUTTON (same as screenshot) */}
            <TouchableOpacity
              onPress={addToGoogleCalendar}
              activeOpacity={0.85}
              style={styles.calendarCard}
            >
              <Ionicons name="calendar" size={22} color="#fff" />
              <Text style={styles.calendarCardText}>Add to Calendar</Text>
            </TouchableOpacity>

            {/* COMMENTS */}
            <Text style={styles.commentsTitle}>Comments</Text>

            {comments.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary }}>
                No comments yet — be the first!
              </Text>
            ) : (
              comments.map((c) => (
                <CommentBlock
                  key={c._id}
                  c={c}
                  onReply={(cm: any) => setReplyTarget(cm)}
                  onDelete={confirmDelete}
                />
              ))
            )}

            <View style={{ height: 150 }} />
          </ScrollView>

          {/* COMMENT INPUT (a little moved up) */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.commentInputWrap, { bottom: 5 }]} // raised up
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
              placeholderTextColor={COLORS.grey}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={handleSendComment}
              style={styles.sendBtn}
            >
              <Ionicons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

/* ============================================================
   COMMENT BLOCK COMPONENT
============================================================ */

function CommentBlock({ c, onReply, onDelete }: any) {
  const replies = useQuery(api.comments.getReplies, { parentId: c._id }) ?? [];

  return (
    <View style={{ marginBottom: hp(2) }}>
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

      {replies.map((r: any) => (
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

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 20,
    backgroundColor: "#fff",
  },

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
    paddingTop: hp(4),
    paddingHorizontal: wp(6),
    paddingBottom: hp(8),
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

  inlineAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  inlineAddText: {
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: "600",
  },
  calendarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    alignSelf: "center",
    marginBottom: 20,
  },

  calendarCardText: {
    color: "#fff",
    marginLeft: 12,
    fontSize: wp(4),
    fontWeight: "700",
  },
});
