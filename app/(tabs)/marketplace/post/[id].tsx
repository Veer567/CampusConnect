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
import { COLORS } from "../../../../constants/themes";
import { api } from "../../../../convex/_generated/api";

export default function MarketplacePostDetail() {
  const { id, scrollTo } = useLocalSearchParams();
  const router = useRouter();

  const { userId: clerkId } = useAuth();

  /* ---------------- CURRENT USER ---------------- */
  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  const safeUserId = me?._id;

  /* ---------------- POST ---------------- */
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
      }, 300);
    }
  }, [scrollTo]);

  /* ---------------- LOADING ---------------- */
  if (!post) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  /* ---------------- STATE ---------------- */
  const isSelf = String(safeUserId) === String(post.creatorId);

  const isJoined =
    safeUserId &&
    post.interestedUsers?.some(
      (u: any) => String(u._id) === String(safeUserId)
    );

  /* ---------------- JOIN / UNJOIN ---------------- */
  const handleJoinToggle = async () => {
    if (isSelf) return;

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

  /* ---------------- MESSAGE ORGANIZER ---------------- */
  const handleMessageOrganizer = async () => {
    // ❌ HARD STOP: user cannot chat with himself
    if (!safeUserId || isSelf) return;

    const conv = await startConversation({
      otherUserId: post.creatorId as Id<"users">,
    });

    const conversationId =
      typeof conv === "object" && conv && "_id" in conv ? conv._id : conv;

    if (!conversationId) return;

    router.push(
      `/chat-screen?conversationId=${conversationId}&otherUserId=${post.creatorId}`
    );
  };
  const interested = post.interestedUsers ?? [];
  const previewUsers = interested.slice(0, 3);
  const extraCount = interested.length - previewUsers.length;

  /* ======================= UI ======================= */

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* IMAGE */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: post.imageUrl || "https://via.placeholder.com/400" }}
          style={styles.headerImage}
        />
      </View>

      {/* TYPE */}
      <View style={styles.typePill}>
        <Text style={styles.typeText}>{post.type.toUpperCase()}</Text>
      </View>

      {/* TITLE */}
      <Text style={styles.title}>{post.title}</Text>

      {/* ORGANIZER CARD */}
      <View style={styles.creatorCard}>
        <Image
          source={{ uri: post.creatorImage || "https://i.pravatar.cc/200" }}
          style={styles.creatorCardAvatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.creatorCardName}>{post.creatorName}</Text>
          <Text style={styles.creatorCardRole}>Organizer</Text>
        </View>

        {/* 💬 MESSAGE ICON (ONLY IF NOT SELF) */}
        {!isSelf && (
          <TouchableOpacity
            onPress={handleMessageOrganizer}
            style={styles.messageBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* STATS */}
      <View style={styles.statsBox}>
        <View style={styles.statCol}>
          <Ionicons name="people-outline" size={18} color={COLORS.primary} />
          <Text style={styles.statNumber}>
            {post.interestedUsers?.length ?? 0}
          </Text>
          <Text style={styles.statLabel}>Interested</Text>
        </View>

        <View style={[styles.statCol, styles.divider]}>
          <Ionicons
            name="sparkles-outline"
            size={18}
            color={COLORS.secondary}
          />
          <Text style={styles.statNumber}>{post.tags?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Skills</Text>
        </View>

        <View style={styles.statCol}>
          <Ionicons name="location-outline" size={18} color={COLORS.primary} />
          <Text style={styles.statNumber}>{post.location ?? "Remote"}</Text>
          <Text style={styles.statLabel}>Location</Text>
        </View>
      </View>

      {/* ABOUT */}
      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.description}>{post.description}</Text>

      {/* SKILLS */}
      {(post.tags?.length ?? 0) > 0 && (
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
      <View>
        <Text style={styles.sectionTitle}>Interested Members</Text>

        {interested.length > 0 && (
          <View style={styles.interestedRow}>
            <View style={styles.avatarStack}>
              {previewUsers.map((u: any, i: number) => (
                <Image
                  key={u._id}
                  source={{ uri: u.image || "https://i.pravatar.cc/150" }}
                  style={[
                    styles.interestedAvatar,
                    {
                      marginLeft: i === 0 ? 0 : -14, 
                      zIndex: 10 - i, 
                    },
                  ]}
                />
              ))}

              {/* +N */}
              {extraCount > 0 && (
                <View
                  style={[
                    styles.moreCount,
                    {
                      marginLeft: -14,
                      zIndex: 1,
                    },
                  ]}
                >
                  <Text style={styles.moreCountText}>+{extraCount}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* JOIN BUTTON (NOT FOR SELF) */}
      {!isSelf && (
        <Animated.View style={{ transform: [{ scale: joinAnim }] }}>
          <TouchableOpacity onPress={handleJoinToggle} style={styles.joinBtn}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.joinGradient}
            >
              <Text style={styles.joinText}>
                {isJoined ? "I'm Joined" : "I'm Interested"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  heroContainer: {
    width: "100%",
    height: 260,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: "hidden",
  },
  headerImage: { width: "100%", height: "100%", resizeMode: "cover" },

  typePill: {
    marginTop: -20,
    marginLeft: 16,
    alignSelf: "flex-start",
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: { color: "#fff", fontWeight: "700" },

  title: {
    fontSize: 26,
    fontWeight: "800",
    margin: 16,
    color: COLORS.text,
  },

  creatorCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  creatorCardAvatar: { width: 52, height: 52, borderRadius: 26 },
  creatorCardName: { fontSize: 17, fontWeight: "700" },
  creatorCardRole: { color: COLORS.textSecondary },

  messageBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },

  statsBox: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCol: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "700" },
  statLabel: { color: COLORS.textSecondary },
  divider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#eee" },

  sectionTitle: {
    marginTop: 26,
    marginLeft: 16,
    fontSize: 17,
    fontWeight: "800",
  },
  description: {
    marginHorizontal: 16,
    marginTop: 6,
    color: COLORS.textSecondary,
  },

  tagsRow: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillPill: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    marginBottom: 10,
  },
  skillText: { color: COLORS.primary, fontWeight: "700" },

  joinBtn: {
    marginTop: 30,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
  },
  joinGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  joinText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  interestedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
  },

  interestedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },

  interestedAvatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#eee",
  },

  moreCount: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  moreCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
