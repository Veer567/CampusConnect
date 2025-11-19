// NotificationScreen.tsx
import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { useFocusEffect } from "expo-router";
import AppHeader from "@/components/AppHeader";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

// map notification type -> ionicon name
const ICON_MAP: Record<string, string> = {
  like: "heart",
  comment: "chatbubble",
  follow: "person-add",
  bookmark: "bookmark",
};

export default function NotificationScreen() {
  // Subscribe to server query — convex will keep this live
  const notifications = useQuery(api.notifications.getNotifcations) ?? [];

  // Animated values: create one Animated.Value per current notification
  const animsRef = useRef<{
    fade: Animated.Value[];
    scale: Animated.Value[];
  } | null>(null);

  // (re)create animation arrays when notifications length changes
  useEffect(() => {
    const len = notifications.length;
    const fades = notifications.map(() => new Animated.Value(0));
    const scales = notifications.map(() => new Animated.Value(0.97));
    animsRef.current = { fade: fades, scale: scales };

    // run entrance animation with small stagger
    Animated.stagger(
      90,
      fades.map((fade, i) =>
        Animated.parallel([
          Animated.timing(fade, {
            toValue: 1,
            duration: 420,
            delay: i * 50,
            useNativeDriver: true,
          }),
          Animated.spring(scales[i], {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, [notifications.length]);

  // helper render item
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const fade =
      animsRef.current?.fade?.[index] ?? new Animated.Value(1 /* immediate */);
    const scale =
      animsRef.current?.scale?.[index] ??
      new Animated.Value(1 /* immediate */);

    const iconName = ICON_MAP[item.type] ?? "notifications";

    // build primary text like: "Aviral liked your post" or "Aviral commented: Nice!"
    const senderName = item.senderId?.username ?? "Someone";
    let primaryText = "";
    if (item.type === "like") primaryText = `${senderName} liked your post`;
    else if (item.type === "follow") primaryText = `${senderName} started following you`;
    else if (item.type === "bookmark") primaryText = `${senderName} bookmarked your post`;
    else if (item.type === "comment") primaryText = `${senderName} commented: ${item.comment ?? ""}`;
    else primaryText = `${senderName} • ${item.type}`;

    // optional preview: post text snippet
    const postPreview = item.post?.content
      ? item.post.content.length > 80
        ? item.post.content.slice(0, 80) + "…"
        : item.post.content
      : null;

    // time formatting
    const createdAt = item.createdAt ? new Date(item.createdAt) : null;
    const timeText = createdAt ? formatDistanceToNow(createdAt, { addSuffix: true }) : "";

    return (
      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <LinearGradient
          colors={["#FFFFFF", "#F9FAFB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Avatar / icon */}
          <View style={styles.iconContainer}>
            {item.senderId?.image ? (
              <Image
                source={{ uri: item.senderId.image }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name={iconName as any} size={20} color={COLORS.primary} />
            )}
          </View>

          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text style={styles.text}>{primaryText}</Text>
            {postPreview ? (
              <Text numberOfLines={1} style={styles.postPreview}>
                {postPreview}
              </Text>
            ) : null}
            <Text style={styles.timeText}>{timeText}</Text>
          </View>

          {/* Options or navigation */}
          <TouchableOpacity
            style={styles.optionsBtn}
            onPress={() => {
              // TODO: open options (mute, delete, go to post, etc.)
              // example: navigation.navigate('Post', { postId: item.post?._id })
            }}
          >
            <MaterialIcons name="more-vert" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={["#EFF6FF", "#FFFFFF"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <AppHeader title="Notifications"  />

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={48} color={COLORS.grey} />
            <Text style={{ marginTop: 12, color: COLORS.grey }}>No notifications yet</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(i) => i._id ?? i._id ?? Math.random().toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={renderItem}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(12),
    paddingTop: hp(1),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(1.5),
    borderWidth: 0.8,
    borderColor: "#E5E7EB",
    backgroundColor: COLORS.surface,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconContainer: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3.5),
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  text: {
    color: COLORS.text,
    fontSize: wp(3.8),
    lineHeight: wp(5),
    fontWeight: "600",
  },
  postPreview: {
    color: COLORS.grey,
    fontSize: wp(3.4),
    marginTop: 4,
  },
  timeText: {
    color: COLORS.grey,
    fontSize: wp(3.2),
    marginTop: 6,
  },
  optionsBtn: {
    paddingHorizontal: wp(1.5),
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
