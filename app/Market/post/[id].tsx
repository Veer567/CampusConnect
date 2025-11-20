import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../../constants/themes";
import { api } from "../../../convex/_generated/api";

export default function MarketplacePostDetail() {
  const { id, scrollTo } = useLocalSearchParams();
  const router = useRouter();

  /* ---------------- AUTH ---------------- */
  const { userId: clerkId } = useAuth();
  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  const safeUserId = me?._id;

  /* ---------------- POST DATA ---------------- */
  const post = useQuery(
    api.marketplace.getMarketplacePostById,
    id ? { id: id as any } : "skip"
  );

  const toggleInterest = useMutation(api.marketplace.toggleInterestOnPost);
  const startConversation = useMutation(api.chat.getOrStartConversation);

  const scrollRef = useRef<ScrollView>(null);
  const joinAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (scrollTo === "comments") {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 400);
    }
  }, [scrollTo]);

  if (!post)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  /* ---------- CONDITIONS ---------- */
  const isSelf = safeUserId && String(post.creatorId) === String(safeUserId);

  const isJoined =
    safeUserId &&
    Array.isArray(post.interestedUsers) &&
    post.interestedUsers.some((u: any) => String(u._id) === String(safeUserId));

  /* ---------------- JOIN TEAM ---------------- */
  const handleJoinToggle = async () => {
    Animated.sequence([
      Animated.timing(joinAnim, {
        toValue: 0.9,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(joinAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    await toggleInterest({ postId: post._id as Id<"marketplacePosts"> });
  };

  /* ---------------- CHAT WITH CREATOR ---------------- */
  const handleMessageCreator = async () => {
    if (!safeUserId || safeUserId === post.creatorId) return;

    const conv = await startConversation({
      otherUserId: post.creatorId as Id<"users">,
    });

    if (!conv) return;

    const conversationId =
      typeof conv === "object" && "_id" in conv ? conv._id : conv;

    router.push(
      `/chat-screen?conversationId=${conversationId}&currentUserId=${safeUserId}&otherUserId=${post.creatorId}`
    );
  };

  /* =============================================================
      UI STARTS HERE
  =============================================================== */
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: 40,
          left: 16,
          zIndex: 20,
          backgroundColor: "rgba(0,0,0,0.35)",
          padding: 10,
          borderRadius: 30,
        }}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      {/* HEADER IMAGE */}
      <Image
        source={{ uri: post.imageUrl || "https://via.placeholder.com/400" }}
        style={styles.headerImage}
      />

      {/* TYPE PILL */}
      <View style={styles.typePill}>
        <Text style={styles.typeText}>{post.type.toUpperCase()}</Text>
      </View>

      {/* TITLE */}
      <Text style={styles.title}>{post.title}</Text>

      {/* ------------ CREATOR CARD ------------ */}
      <View style={styles.creatorCard}>
        <Image
          source={{ uri: post.creatorImage || "https://i.pravatar.cc/200" }}
          style={styles.creatorCardAvatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.creatorCardName}>{post.creatorName}</Text>
          <Text style={styles.creatorCardRole}>Organizer</Text>
        </View>

        {/* CHAT BUTTON (ONLY OTHERS CAN CHAT) */}
        {!isSelf && (
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={handleMessageCreator}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ------------ STATS ------------ */}
      <View style={styles.statsBox}>
        <View style={styles.statCol}>
          <Ionicons name="people-outline" size={18} color={COLORS.primary} />
          <Text style={styles.statNumber}>
            {post.interestedUsers?.length ?? 0}
          </Text>
          <Text style={styles.statLabel}>Interested</Text>
        </View>

        <View style={[styles.statCol, styles.divider]}>
          <Ionicons name="sparkles" size={18} color={COLORS.secondary} />
          <Text style={styles.statNumber}>{(post.tags ?? []).length}</Text>
          <Text style={styles.statLabel}>Skills</Text>
        </View>

        <View style={styles.statCol}>
          <Ionicons name="location-outline" size={18} color={COLORS.primary} />
          <Text style={styles.statNumber}>{post.location ?? "Remote"}</Text>
          <Text style={styles.statLabel}>Location</Text>
        </View>
      </View>

      {/* ------------ ABOUT ------------ */}
      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.description}>{post.description}</Text>

      {/* ------------ SKILLS ------------ */}
      {(post.tags ?? []).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Required Skills</Text>
          <View style={styles.tagsRow}>
            {(post.tags ?? []).map((t) => (
              <View key={t} style={styles.skillPill}>
                <Text style={styles.skillText}>{t}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ------------ INTERESTED MEMBERS ------------ */}
      <Text style={styles.sectionTitle}>Interested Members</Text>

      <View style={styles.avatarRow}>
        {(post.interestedUsers ?? []).slice(0, 5).map((user: any) => (
          <Image
            key={user._id}
            source={{ uri: user.image || "https://i.pravatar.cc/200" }}
            style={styles.interestedAvatar}
          />
        ))}

        {(post.interestedUsers ?? []).length > 5 && (
          <View style={styles.moreCircle}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              +{(post.interestedUsers ?? []).length - 5}
            </Text>
          </View>
        )}
      </View>

      {/* ------------ JOIN BUTTON ------------ */}
      {!isSelf && (
        <Animated.View style={{ transform: [{ scale: joinAnim }] }}>
          <TouchableOpacity onPress={handleJoinToggle} style={styles.joinBtn}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.joinGradient}
            >
              <Text style={styles.joinText}>
                {isJoined ? "Joined ✔" : "Join Team"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

/* =============================================================
      STYLES
============================================================== */
const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  container: { flex: 1, backgroundColor: COLORS.background },

  headerImage: {
    width: "100%",
    height: 240,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  typePill: {
    position: "absolute",
    top: 200,
    left: 16,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: { fontWeight: "700", color: "#fff" },

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 24,
    marginHorizontal: 16,
    color: COLORS.text,
  },

  /* CREATOR CARD */
  creatorCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },
  creatorCardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  creatorCardName: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  creatorCardRole: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },

  /* MESSAGE BUTTON */
  messageBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    gap: 6,
  },
  messageBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },

  /* STATS */
  statsBox: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCol: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "700", marginTop: 6 },
  statLabel: { color: COLORS.textSecondary, marginTop: 4 },
  divider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.surfaceLight,
  },

  /* ABOUT */
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  description: {
    marginHorizontal: 16,
    marginTop: 6,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  /* SKILLS */
  skillPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 999,
    borderColor: COLORS.primary,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: { color: COLORS.primary, fontWeight: "700" },

  tagsRow: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  /* INTERESTED MEMBERS */
  avatarRow: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  interestedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 8,
  },
  moreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  /* JOIN BUTTON */
  joinBtn: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
  },
  joinGradient: { paddingVertical: 16, alignItems: "center" },
  joinText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
