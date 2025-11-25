// app/notifications.tsx
import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import {
  differenceInCalendarWeeks,
  formatDistanceToNow,
  isToday,
  isYesterday,
} from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
 
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

// -----------------------------
// Simple ID type for UI layer
// -----------------------------
type NotificationItem = {
  _id: string;
  createdAt: number;
  read?: boolean;
  type?: string;
  sender?: { _id?: string; username?: string; image?: string } | null;
  senderId?: string;
  post?: { _id?: string; title?: string } | null;
  postId?: string;
  conversationId?: string;
  title?: string;
  comment?: string;
};

// -----------------------------
// Date label grouping helper
// -----------------------------
function groupLabelForDate(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  const weeks = differenceInCalendarWeeks(new Date(), d);
  if (weeks === 0) return "This Week";
  return "Older";
}

// -----------------------------
// Skeleton shimmer (simple)
// -----------------------------
function SkeletonRow() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      })
    ).start();
  }, [anim]);

  const translate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.5, width * 0.5],
  });

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <View
          style={{
            width: wp(7),
            height: wp(7),
            borderRadius: wp(3.5),
            backgroundColor: "#eee",
          }}
        />
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            height: 14,
            width: "70%",
            backgroundColor: "#eee",
            borderRadius: 6,
            marginBottom: 6,
          }}
        />
        <View
          style={{
            height: 12,
            width: "40%",
            backgroundColor: "#eee",
            borderRadius: 6,
          }}
        />
      </View>

      <Animated.View
        style={[
          styles.waveOverlay,
          { transform: [{ translateX: translate }], opacity: 0.12 },
        ]}
      />
    </View>
  );
}

// -----------------------------
// Main Screen
// -----------------------------
export default function NotificationsScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();

  // Convex data
  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const notificationsRaw = useQuery(api.notifications.getNotifications) ?? null;

  const deleteNotif = useMutation(api.notifications.deleteNotification);
  const markRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const getOrStartConversation = useMutation(api.chat.getOrStartConversation);

  // animation refs (one for each notification item)
  const animRefs = useRef<
    {
      fade: Animated.Value;
      scale: Animated.Value;
      wave: Animated.Value;
    }[]
  >([]);

  // initialize anim refs whenever notifications change
  useEffect(() => {
    if (!notificationsRaw) {
      animRefs.current = [];
      return;
    }
    animRefs.current = notificationsRaw.map(() => ({
      fade: new Animated.Value(0),
      scale: new Animated.Value(0.98),
      wave: new Animated.Value(-width * 0.6), // start off-left
    }));
    // small entrance animation on mount
    Animated.stagger(
      60,
      animRefs.current.map((a) =>
        Animated.parallel([
          Animated.timing(a.fade, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
          }),
          Animated.spring(a.scale, {
            toValue: 1,
            friction: 7,
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, [notificationsRaw?.length]);

  // run the wave ripple once each time screen is focused (staggered)
  useFocusEffect(
    useCallback(() => {
      if (!notificationsRaw || !animRefs.current.length) return;

      // reset waves
      animRefs.current.forEach((a) => a.wave.setValue(-width * 0.6));

      const waveAnimations = animRefs.current.map((a, idx) =>
        Animated.sequence([
          Animated.delay(idx * 80), // stagger each card
          Animated.timing(a.wave, {
            toValue: width * 0.6,
            duration: 520,
            useNativeDriver: true,
          }),
          Animated.timing(a.wave, {
            toValue: -width * 0.6,
            duration: 120,
            useNativeDriver: true,
            // a short snap-back so repeated focus shows ripple again
          }),
        ])
      );

      Animated.parallel(waveAnimations).start();

      // also replay small entrance (subtle)
      Animated.stagger(
        40,
        animRefs.current.map((a) =>
          Animated.parallel([
            Animated.timing(a.fade, {
              toValue: 1,
              duration: 380,
              useNativeDriver: true,
            }),
            Animated.spring(a.scale, {
              toValue: 1,
              friction: 8,
              useNativeDriver: true,
            }),
          ])
        )
      ).start();

      // no cleanup needed (animations finish)
    }, [notificationsRaw])
  );

  // Group notifications by date label
  const grouped = useMemo(() => {
    if (!notificationsRaw) return {};
    return notificationsRaw.reduce<Record<string, NotificationItem[]>>(
      (acc: any, n: any) => {
        const d = n.createdAt ? new Date(n.createdAt) : new Date();
        const label = groupLabelForDate(d);
        if (!acc[label]) acc[label] = [];
        acc[label].push(n);
        return acc;
      },
      {}
    );
  }, [notificationsRaw]);

  const groupOrder = ["Today", "Yesterday", "This Week", "Older"];

  const flattened = useMemo(() => {
    if (!grouped) return [];
    const out: { label: string; data: NotificationItem[] }[] = [];
    groupOrder.forEach((g) => {
      if (grouped[g]?.length) out.push({ label: g, data: grouped[g] });
    });
    Object.keys(grouped).forEach((k) => {
      if (!groupOrder.includes(k)) out.push({ label: k, data: grouped[k] });
    });
    return out;
  }, [grouped]);

  // helper: open or create direct conversation and navigate
  const openChatForSender = async (senderId: string, convId?: string) => {
    try {
      let finalConvId = convId;
      if (!finalConvId) {
        const conv = await getOrStartConversation({
          otherUserId: senderId as any,
        });
        if (!conv || !conv._id) {
          Alert.alert("Error", "Could not open conversation");
          return;
        }
        finalConvId = String(conv._id);
      }
      router.push({
        pathname: "/chat-screen",
        params: {
          conversationId: String(finalConvId),
          currentUserId: String(me?._id),
          otherUserId: String(senderId),
        },
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not open conversation");
    }
  };

  // pressed a notification
  const onPressNotification = async (
    n: NotificationItem,
    globalIndex: number
  ) => {
    try {
      // 🔥 Ensure the notification is marked as read BEFORE navigating
      if (!n.read) {
        await markRead({ id: n._id as any });
      }
    } catch (err) {
      console.log("Failed to mark read:", err);
    }

    // -------------------------
    // Redirect logic
    // -------------------------

    if (n.type === "comment" || n.type === "mention") {
      return router.push({
        pathname: "/post-details",
        params: { postId: n.postId ?? n.post?._id, scrollTo: "comments" },
      });
    }

    if (n.type === "message") {
      const sender = n.sender?._id ?? n.senderId;

      if (!sender) {
        return router.push({
          pathname: "/other-profile",
          params: { userId: n.senderId ?? n.sender?._id },
        });
      }

      await openChatForSender(String(sender), n.conversationId);
      return;
    }

    if (n.type === "follow") {
      const sender = n.sender?._id ?? n.senderId;
      return router.push({
        pathname: "/other-profile",
        params: { userId: sender },
      });
    }

    // default open post
    if (n.postId || n.post?._id) {
      return router.push({
        pathname: "/post-details",
        params: { postId: n.postId ?? n.post?._id },
      });
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteNotif({ id: id as any });
    } catch {
      Alert.alert("Error", "Could not delete notification");
    }
  };

  // render a single notification card; we find corresponding anim index for wave
  const renderCard = (n: NotificationItem, globalIndex: number) => {
    const anim = animRefs.current[globalIndex] ?? {
      fade: new Animated.Value(1),
      scale: new Animated.Value(1),
      wave: new Animated.Value(-width * 0.6),
    };

    const waveTranslate = anim.wave.interpolate({
      inputRange: [-width * 0.6, width * 0.6],
      outputRange: [-width * 0.6, width * 0.6],
    });

    const timeText = formatDistanceToNow(new Date(n.createdAt), {
      addSuffix: true,
    });

    return (
      <Animated.View
        key={n._id}
        style={[
          styles.card,
          {
            opacity: anim.fade,
            transform: [{ scale: anim.scale }],
          },
        ]}
      >
        <Pressable
          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
          onPress={() => onPressNotification(n, globalIndex)}
          style={styles.cardInner}
        >
          {/* avatar / icon */}
          <View style={styles.iconContainer}>
            {n.sender?.image ? (
              <Image source={{ uri: n.sender.image }} style={styles.avatar} />
            ) : (
              <Ionicons
                name="notifications-outline"
                size={20}
                color={COLORS.primary}
              />
            )}
          </View>

          {/* main text */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.text}>
              {n.sender?.username ? `${n.sender.username} ` : ""}
              <Text style={{ fontWeight: "700" }}>{n.title ?? n.type}</Text>
              {n.comment
                ? `: ${n.comment}`
                : n.post?.title
                  ? ` • ${n.post.title}`
                  : ""}
            </Text>

            <Text style={styles.timeText}>{timeText}</Text>
          </View>

          {/* delete X */}
          <TouchableOpacity
            onPress={() => onDelete(n._id)}
            style={{ padding: 8 }}
          >
            <Ionicons name="close" size={20} color="#ff3b30" />
          </TouchableOpacity>

          {/* wave overlay (absolute inside card) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.waveOverlay,
              {
                transform: [{ translateX: waveTranslate }],
                opacity: 0.12,
              },
            ]}
          />
        </Pressable>
      </Animated.View>
    );
  };

  const loading = notificationsRaw === null;

  return (
    <LinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}edges={[]}>
        <AppHeader
          title="Notifications"
          rightIcon="checkmark-done-outline"
          onRightPress={async () => {
            try {
              await markAllRead({});
            } catch {
              Alert.alert("Error", "Could not mark all read");
            }
          }}
          showBackButton
          onBackPress={() => router.back()}
        />

        {loading ? (
          <View style={{ paddingHorizontal: wp(5), paddingTop: hp(2) }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ marginBottom: hp(1.5) }}>
                <SkeletonRow />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={flattened}
            keyExtractor={(g) => g.label}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item: group, index: gIdx }) => {
              // compute base global index for this group's first item so we can map anim refs
              const baseIndex = Object.values(grouped)
                .slice(0, Object.keys(grouped).indexOf(group.label))
                .reduce((acc, arr: any) => acc + (arr?.length || 0), 0);

              return (
                <View key={group.label}>
                  <Text style={styles.groupLabel}>{group.label}</Text>
                  {group.data.map((n: NotificationItem, i: number) => (
                    <View key={n._id} style={{ marginBottom: hp(0.7) }}>
                      {renderCard(n, baseIndex + i)}
                    </View>
                  ))}
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// -----------------------------
// Styles
// -----------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: wp(5), paddingBottom: hp(12), paddingTop: hp(1) },
  groupLabel: {
    marginTop: hp(2),
    marginBottom: hp(1),
    marginLeft: wp(1),
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  card: {
    borderRadius: wp(3),
    overflow: "hidden",
    marginHorizontal: 0,
    // subtle shadow
    backgroundColor: COLORS.surface,
    borderWidth: Platform.OS === "ios" ? 0.6 : 0.5,
    borderColor: "#EAEAEA",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(3.6),
    position: "relative",
  },
  iconContainer: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: "rgba(14,165,233,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3),
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },
  text: { color: COLORS.text, fontSize: wp(3.8), lineHeight: wp(4.8) },
  timeText: { color: COLORS.grey, fontSize: wp(3.1), marginTop: hp(0.2) },

  // ripple/wave overlay (absolute)
  waveOverlay: {
    position: "absolute",
    left: -width * 0.6,
    top: 0,
    bottom: 0,
    width: width * 1.2,
    backgroundColor: "#ffffff",
    opacity: 0.12,
  },

  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "60%",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
});
