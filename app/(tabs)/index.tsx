// FEED SCREEN — WITH BADGE + FULL SKELETON LOADER (NO HOOK ORDER ERRORS)

import AppHeader from "@/components/AppHeader";
import { useAuth } from "@clerk/clerk-expo";

import GlobalAlert, { useAlert } from "@/components/GlobalAlert";
import Post from "@/components/Posts";
import { api } from "@/convex/_generated/api";

import { feedStyles } from "@/styles/feed.styles";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");
type RawPost = {
  _id: string;
  title?: string;
  caption?: string;
  category?: string;
  imageUrl?: string;
  author?: {
    _id: string | null;
    username?: string;
    image?: string;
    fullname?: string;
  };
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  _creationTime: number;
  location?: string;
  eventDate?: string;
  isOwner?: boolean;
  tags?: string[];
};

// Categories
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

async function requestNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();

  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

/* ----------------------------------------------------------
   FULL SCREEN SKELETON LOADER
---------------------------------------------------------- */
/* ----------------------------------------------------------
   FULL SCREEN FEED SKELETON (Header + Icons + Search + Categories + Posts)
---------------------------------------------------------- */

const FullFeedSkeleton = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-250, 250],
  });

  const Shimmer = () => (
    <Animated.View
      style={[feedSkeletonStyles.shimmer, { transform: [{ translateX }] }]}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ---------- HEADER ---------- */}
          <View style={feedSkeletonStyles.headerRow}>
            <View style={feedSkeletonStyles.headerLeft} />
            <View style={feedSkeletonStyles.headerRightGroup}>
              <View style={feedSkeletonStyles.headerIcon} />
              <View style={feedSkeletonStyles.headerIcon} />
            </View>
          </View>

          {/* ---------- SEARCH BAR ---------- */}
          <View style={feedSkeletonStyles.searchBar} />

          {/* ---------- CATEGORY CHIPS ---------- */}
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={feedSkeletonStyles.categoryChip} />
            ))}
          </View>

          {/* ---------- POSTS ---------- */}
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={feedSkeletonStyles.postCard}>
              {/* TITLE */}
              <View style={feedSkeletonStyles.postTitle} />

              {/* IMAGE */}
              <View style={feedSkeletonStyles.postImage}>
                <Shimmer />
              </View>

              {/* LINES */}
              <View style={feedSkeletonStyles.postLine} />
              <View style={[feedSkeletonStyles.postLine, { width: "70%" }]} />
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

/* ----------------------------------------------------------
   FEED SCREEN
---------------------------------------------------------- */
export default function FeedScreen() {
  const { isSignedIn } = useAuth();

  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const showAlert = useAlert((s) => s.show);
  useEffect(() => {
    const checkNotificationPrompt = async () => {
      try {
        const alreadyPrompted = await AsyncStorage.getItem(
          "@notifications_permission_prompted"
        );

        if (alreadyPrompted) return;

        showAlert({
          title: "Notifications",
          message:
            "You can enable notifications anytime from Settings to stay updated with messages, likes, comments, and campus updates.",
          confirmText: "OK",
          onConfirm: async () => {
            await AsyncStorage.setItem(
              "@notifications_permission_prompted",
              "true"
            );
          },
        });
      } catch (e) {
        console.log("Notification info prompt failed", e);
      }
    };

    checkNotificationPrompt();
  }, []);

  // DATA
  const unreadMessages =
    useQuery(api.chat.getUnreadMessageCount, isSignedIn ? {} : "skip") ?? 0;

  const unreadNotifications =
    useQuery(api.notifications.getUnreadCount, isSignedIn ? {} : "skip") ?? 0;

  const posts = useQuery(api.posts.getFeedPosts, isSignedIn ? {} : "skip");

  // LOADING FLAG (NO EARLY RETURN)
  const isLoading = posts === undefined;

  // MAP POSTS
  const mappedPosts = useMemo(() => {
    if (!posts) return [];

    return posts.map((post: RawPost) => ({
      _id: post._id,
      title: post.title ?? "Untitled",
      caption: post.caption ?? "",
      category: post.category ?? "Other",
      imageUrl: post.imageUrl,
      author: {
        _id: post.author?._id ?? "",
        username: post.author?.username ?? "Anonymous",
        image: post.author?.image ?? "",
      },
      likes: post.likes ?? 0,
      comments: post.comments ?? 0,
      isLiked: !!post.isLiked,
      isBookmarked: !!post.isBookmarked,
      _creationTime: post._creationTime,
      location: post.location,
      eventDate: post.eventDate,
      isOwner: !!post.isOwner,
      tags: post.tags ?? [],
    }));
  }, [posts]);

  // CATEGORY ANIM
  const categoryScales = useRef(
    categories.map(() => new Animated.Value(1))
  ).current;

  // FILTERED POSTS
  const filteredPosts = useMemo(() => {
    if (selectedCategory.name === "All") return mappedPosts;
    return mappedPosts.filter((p) => p.category === selectedCategory.name);
  }, [mappedPosts, selectedCategory]);

  // REFRESH
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <SafeAreaProvider>
      <LinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={{ flex: 1 }}>
        <SafeAreaView style={feedStyles.container}>
          {/* HEADER */}
          <View style={{ position: "relative" }}>
            <AppHeader
              title="Campus Connect "
              alignLeft
              showBackButton={false}
            />

            {/* ICONS */}
            <View style={feedStyles.headerRightContainer}>
              {/* Notifications */}
              <TouchableOpacity
                style={{ marginRight: 18 }}
                onPress={() => router.push("/notifications")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="white"
                />

                {unreadNotifications > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Chat */}
              <TouchableOpacity onPress={() => router.push("/chat")}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={24}
                  color="white"
                />

                {unreadMessages > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* SEARCH */}
          <TouchableOpacity
            onPress={() => router.push("/search")}
            activeOpacity={0.7}
            style={feedStyles.searchBar}
          >
            <Ionicons name="search-outline" size={20} color="#777" />
            <Text style={feedStyles.searchText}>
              Search users, posts or #tags...
            </Text>
          </TouchableOpacity>

          {/* CATEGORIES */}
          <View style={feedStyles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat, index) => {
                const active = selectedCategory.id === cat.id;

                return (
                  <Animated.View
                    key={cat.id}
                    style={{ transform: [{ scale: categoryScales[index] }] }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setSelectedCategory(cat)}
                      style={[
                        feedStyles.categoryButton,
                        active && feedStyles.categoryButtonActive,
                      ]}
                    >
                      <Text style={feedStyles.categoryIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          feedStyles.categoryText,
                          active && feedStyles.categoryTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>

          {/* POSTS / SKELETON */}
          {isLoading ? (
            <FullFeedSkeleton />
          ) : (
            <FlatList
              data={filteredPosts}
              renderItem={({
                item,
              }: {
                item: (typeof filteredPosts)[number];
              }) => <Post post={item as any} />}
              keyExtractor={(item) => item._id}
              initialNumToRender={4}
              maxToRenderPerBatch={6}
              windowSize={5}
              removeClippedSubviews
              showsVerticalScrollIndicator={false}
            />
          )}
          <GlobalAlert />
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

/* BADGE STYLES */
const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -6,
    top: -4,
    backgroundColor: "#ff3b30",
    minWidth: 17,
    height: 17,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});

/* SKELETON STYLES */
/* ----------------------------------------------------------
   FULL FEED SKELETON STYLES
---------------------------------------------------------- */
const feedSkeletonStyles = StyleSheet.create({
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: 150,
    backgroundColor: "rgba(255,255,255,0.5)",
    opacity: 0.7,
  },

  /* ---------- HEADER ---------- */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  headerLeft: {
    height: 30,
    width: 180,
    backgroundColor: "#e2e2e2",
    borderRadius: 8,
  },

  headerRightGroup: {
    flexDirection: "row",
    gap: 12,
  },

  headerIcon: {
    height: 32,
    width: 32,
    backgroundColor: "#e4e4e4",
    borderRadius: 16,
  },

  /* ---------- SEARCH BAR ---------- */
  searchBar: {
    height: 44,
    backgroundColor: "#e8e8e8",
    borderRadius: 12,
    marginBottom: 20,
  },

  /* ---------- CATEGORY CHIPS ---------- */
  categoryChip: {
    height: 36,
    width: 100,
    backgroundColor: "#e5e5e5",
    borderRadius: 18,
    marginRight: 12,
    overflow: "hidden",
  },

  /* ---------- POST CARD ---------- */
  postCard: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ededed",
    marginBottom: 22,
  },

  postTitle: {
    height: 18,
    width: "50%",
    backgroundColor: "#e3e3e3",
    borderRadius: 6,
    marginBottom: 12,
  },

  postImage: {
    height: 200,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    marginBottom: 14,
    overflow: "hidden",
  },

  postLine: {
    height: 14,
    backgroundColor: "#e3e3e3",
    borderRadius: 6,
    marginBottom: 10,
    width: "90%",
  },
});
