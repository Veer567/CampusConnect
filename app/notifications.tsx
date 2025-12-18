// app/notifications.tsx

import AppHeader from "@/components/AppHeader";
import GlobalAlert, { useAlert } from "@/components/GlobalAlert";
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
import React, { useCallback, useMemo, useRef } from "react";
import {
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

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

/* ──────────────────────────────────────
  TYPES
────────────────────────────────────── */
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
  count?: number;
};

/* ──────────────────────────────────────
  DATE GROUPING
────────────────────────────────────── */
function groupLabelForDate(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  const weeks = differenceInCalendarWeeks(new Date(), d);
  if (weeks === 0) return "This Week";
  return "Older";
}

/* ──────────────────────────────────────
  GROUP SIMILAR NOTIFICATIONS
────────────────────────────────────── */
function groupSimilarNotifications(
  notifications: NotificationItem[]
): NotificationItem[] {
  const map = new Map<string, NotificationItem>();

  for (const n of notifications) {
    const day = new Date(n.createdAt).toDateString();
    const key = [
      n.type,
      n.senderId ?? n.sender?._id,
      n.postId ?? n.post?._id,
      day,
    ].join("|");

    if (!map.has(key)) {
      map.set(key, { ...n, count: 1 });
    } else {
      const existing = map.get(key)!;
      existing.count = (existing.count ?? 1) + 1;
      existing.createdAt = Math.max(existing.createdAt, n.createdAt);
    }
  }

  return Array.from(map.values());
}

/* ──────────────────────────────────────
  SCREEN
────────────────────────────────────── */
export default function NotificationsScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const showAlert = useAlert((s) => s.show);

  // 🔒 Prevent double navigation
  const hasNavigatedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      hasNavigatedRef.current = false;
    }, [])
  );

  const notificationsRaw = useQuery(api.notifications.getNotifications);
  const loading = notificationsRaw === undefined;

  const markSingleRead = useMutation(api.notifications.markNotificationRead);
  const markMessagesFromSenderRead = useMutation(
    api.notifications.markMessagesFromSenderRead
  );
  const deleteNotif = useMutation(api.notifications.deleteNotification);
  const clearAll = useMutation(api.notifications.clearAllNotifications);
  const getOrStartConversation = useMutation(api.chat.getOrStartConversation);

  /* ──────────────────────────────────────
    GROUP DATA
  ─────────────────────────────────────── */
  const grouped = useMemo(() => {
    if (!notificationsRaw) return {};
    const groupedSimilar = groupSimilarNotifications(notificationsRaw);

    return groupedSimilar.reduce<Record<string, NotificationItem[]>>(
      (acc, n) => {
        const label = groupLabelForDate(new Date(n.createdAt));
        if (!acc[label]) acc[label] = [];
        acc[label].push(n);
        return acc;
      },
      {}
    );
  }, [notificationsRaw]);

  const groupOrder = ["Today", "Yesterday", "This Week", "Older"];

  const flattened = useMemo(() => {
    return groupOrder
      .filter((g) => grouped[g]?.length)
      .map((g) => ({ label: g, data: grouped[g] }));
  }, [grouped]);

  /* ──────────────────────────────────────
    PRESS HANDLER (FULLY FIXED)
  ─────────────────────────────────────── */
  const onPressNotification = async (n: NotificationItem) => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    // MESSAGE (GROUPED)
    if (n.type === "message") {
      const senderId = n.sender?._id ?? n.senderId;
      if (!senderId) return;

      // ✅ Mark ALL messages from this sender as read
      await markMessagesFromSenderRead({
        senderId: senderId as any,
      });

      const conv = await getOrStartConversation({
        otherUserId: senderId as any,
      });

      router.push({
        pathname: "/chat-screen",
        params: {
          conversationId: String(conv?._id),
          otherUserId: String(senderId),
        },
      });
      return;
    }

    // NON-MESSAGE → mark only this one
    if (!n.read) {
      try {
        await markSingleRead({ id: n._id as any });
      } catch {}
    }

    // FOLLOW
    if (n.type === "follow") {
      router.replace({
        pathname: "/other-profile",
        params: { userId: n.senderId ?? n.sender?._id },
      });
      return;
    }

    // POST / COMMENT
    if (n.postId || n.post?._id) {
      router.replace({
        pathname: "/post-details",
        params: { postId: n.postId ?? n.post?._id },
      });
    }
  };

  /* ──────────────────────────────────────
    CARD
  ─────────────────────────────────────── */
  const renderCard = (n: NotificationItem) => {
    const timeText = formatDistanceToNow(new Date(n.createdAt), {
      addSuffix: true,
    });

    return (
      <Pressable
        key={n._id}
        style={styles.card}
        android_ripple={{ color: "rgba(0,0,0,0.05)" }}
        onPress={() => onPressNotification(n)}
      >
        <View style={styles.cardInner}>
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

          <View style={{ flex: 1 }}>
            <Text style={styles.text}>
              {n.sender?.username ? `${n.sender.username} ` : ""}
              <Text style={{ fontWeight: "700" }}>{n.title ?? n.type}</Text>
              {n.count && n.count > 1 && (
                <Text style={{ fontWeight: "700" }}> ({n.count})</Text>
              )}
              {n.post?.title ? ` • ${n.post.title}` : ""}
            </Text>

            <Text style={styles.timeText}>{timeText}</Text>
          </View>

          <TouchableOpacity onPress={() => deleteNotif({ id: n._id as any })}>
            <Ionicons name="close" size={18} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  /* ──────────────────────────────────────
    UI
  ─────────────────────────────────────── */
  return (
    <LinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={[]}>
        <AppHeader
          title="Notifications"
          rightIcon="trash-outline"
          onRightPress={() =>
            showAlert({
              title: "Clear Notifications",
              message: "Delete all notifications?",
              confirmText: "Clear",
              cancelText: "Cancel",
              onConfirm: clearAll,
            })
          }
          onBackPress={() => {
            router.replace("/(tabs)");
          }}
        />

        {loading ? (
          <View style={{ padding: wp(5) }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.skeleton} />
            ))}
          </View>
        ) : (
          <FlatList
            data={flattened}
            keyExtractor={(item) => item.label}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View>
                <Text style={styles.groupLabel}>{item.label}</Text>
                {item.data.map((n) => (
                  <View key={n._id} style={{ marginBottom: 8 }}>
                    {renderCard(n)}
                  </View>
                ))}
              </View>
            )}
          />
        )}
      </SafeAreaView>

      <GlobalAlert />
    </LinearGradient>
  );
}

/* ──────────────────────────────────────
  STYLES
────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: wp(5), paddingBottom: 80 },

  groupLabel: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  card: {
    borderRadius: wp(3),
    backgroundColor: COLORS.surface,
    borderWidth: Platform.OS === "ios" ? 0.5 : 0.3,
    borderColor: "#EAEAEA",
    elevation: 2,
  },

  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(3.5),
  },

  iconContainer: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: "rgba(14,165,233,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3),
  },

  avatar: { width: "100%", height: "100%" },

  text: { fontSize: wp(3.8), color: COLORS.text },
  timeText: { fontSize: wp(3.1), color: COLORS.grey, marginTop: 2 },

  skeleton: {
    height: 72,
    backgroundColor: "#eee",
    borderRadius: 12,
    marginBottom: 12,
  },
});
