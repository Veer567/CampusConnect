// app/notifications.tsx
import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import GlobalAlert, { useAlert } from "@/components/GlobalAlert";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
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

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

/*───────────────────────────────────────────
  TYPES
───────────────────────────────────────────*/
type GroupedNotification = {
  _id: string;
  type: string;
  createdAt: number;
  read: boolean;
  count: number;
  sender?: { _id?: string; username?: string; image?: string } | null;
  postId?: string;
};

type DayGroup = {
  label: "Today" | "Yesterday" | "Older";
  items: GroupedNotification[];
};

type Row =
  | { type: "header"; label: string }
  | { type: "item"; item: GroupedNotification };

/*───────────────────────────────────────────
  MAIN
───────────────────────────────────────────*/
export default function NotificationsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const showAlert = useAlert((s) => s.show);

  const data = useQuery(
    api.notifications.getNotifications,
    userId ? {} : "skip"
  ) as DayGroup[] | undefined;

  const markRead = useMutation(api.notifications.markNotificationRead);
  const deleteNotif = useMutation(api.notifications.deleteNotification);
  const clearAll = useMutation(api.notifications.clearAllNotifications);

  /*───────────────────────────────────────────
    FLATTEN FOR FLATLIST
  ───────────────────────────────────────────*/
  const rows = useMemo<Row[]>(() => {
    if (!data) return [];

    return data.flatMap((group) => [
      { type: "header", label: group.label },
      ...group.items.map((item) => ({ type: "item", item } as Row)),
    ]) as Row[];
  }, [data]);

  /*───────────────────────────────────────────
    HANDLERS
  ───────────────────────────────────────────*/
  const onPress = async (n: GroupedNotification) => {
    if (!n.read) {
      await markRead({ id: n._id as any });
    }

    if (n.type === "message") {
      return router.push("/chat-screen");
    }

    if (n.type === "follow") {
      return router.push({
        pathname: "/other-profile",
        params: { userId: n.sender?._id },
      });
    }

    if (n.postId) {
      return router.push({
        pathname: "/post-details",
        params: { postId: n.postId },
      });
    }
  };

  const renderItem = ({ item }: { item: Row }) => {
    if (item.type === "header") {
      return <Text style={styles.groupLabel}>{item.label}</Text>;
    }

    const n = item.item;

    return (
      <Pressable
        onPress={() => onPress(n)}
        android_ripple={{ color: "rgba(0,0,0,0.05)" }}
        style={[
          styles.card,
          !n.read && { backgroundColor: "#F0F9FF" },
        ]}
      >
        <View style={styles.row}>
          {/* Avatar */}
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

          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text style={styles.text}>
              {n.sender?.username}{" "}
              <Text style={{ fontWeight: "700" }}>
                {n.type}
              </Text>
              {n.count > 1 && (
                <Text style={{ fontWeight: "700" }}>
                  {" "}
                  ({n.count})
                </Text>
              )}
            </Text>
          </View>

          {/* Delete */}
          <TouchableOpacity onPress={() => deleteNotif({ id: n._id as any })}>
            <Ionicons name="close" size={18} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  /*───────────────────────────────────────────
    UI
  ───────────────────────────────────────────*/
  return (
    <LinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={[]}>
        <AppHeader
          title="Notifications"
          rightIcon="trash-outline"
          onRightPress={() =>
            showAlert({
              title: "Clear all?",
              message: "Delete all notifications?",
              confirmText: "Clear",
              cancelText: "Cancel",
              onConfirm: async () => await clearAll(),
            })
          }
        />

        <FlatList
          data={rows}
          keyExtractor={(item, idx) =>
            item.type === "header"
              ? `h-${item.label}`
              : `n-${item.item._id}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
      <GlobalAlert />
    </LinearGradient>
  );
}

/*───────────────────────────────────────────
  STYLES
───────────────────────────────────────────*/
const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: wp(5), paddingBottom: hp(10) },

  groupLabel: {
    marginTop: hp(2),
    marginBottom: hp(1),
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  card: {
    borderRadius: wp(3),
    padding: wp(3.5),
    marginBottom: hp(1),
    backgroundColor: COLORS.surface,
    borderWidth: Platform.OS === "ios" ? 0.6 : 0.5,
    borderColor: "#EAEAEA",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: "rgba(14,165,233,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3),
    overflow: "hidden",
  },

  avatar: { width: "100%", height: "100%" },

  text: {
    color: COLORS.text,
    fontSize: wp(3.8),
    lineHeight: wp(4.8),
  },
});
