// FEED SCREEN — WITH BADGE + FULL SKELETON LOADER (NO HOOK ORDER ERRORS)

import AppHeader from "@/components/AppHeader";
import Post from "@/components/Posts";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import usePushNotifications from "@/hooks/usePushNotifications";
import { feedStyles } from "@/styles/feed.styles";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

// Categories
const categories = [
  { id: 0, name: "All", icon: "📄" },
  { id: 1, name: "Placements", icon: "👨‍💼" },
  { id: 2, name: "Workshops", icon: "🛠️" },
  { id: 3, name: "Hackathon", icon: "🚀" },
  { id: 4, name: "Festivals", icon: "🎉" },
  { id: 5, name: "Sports", icon: "🏅" },
  { id: 6, name: "Other", icon: "✨" },
];

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
        duration: 1300,
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
      style={[
        feedSkeletonStyles.shimmer,
        { transform: [{ translateX }] },
      ]}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#EFF6FF", "#FFFFFF"]}
        style={{ flex: 1 }}
      >
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={feedSkeletonStyles.categoryChip}>
                <Shimmer />
              </View>
            ))}
          </ScrollView>

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
  usePushNotifications();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  // DATA
  const unreadMessages = useQuery(api.chat.getUnreadMessageCount) ?? 0;
  const unreadNotifications = useQuery(api.notifications.getUnreadCount) ?? 0;
  const posts = useQuery(api.posts.getFeedPosts);

  // LOADING FLAG (NO EARLY RETURN)
  const isLoading = !posts;

  // MAP POSTS
  const mappedPosts = useMemo(() => {
    if (!posts) return [];
    return posts.map((post) => ({
      _id: post._id,
      title: post.title ?? "Untitled",
      caption: post.caption ?? "",
      category: post.category ?? "Other",
      imageUrl: post.imageUrl ?? undefined,
      author: {
        _id: post.author._id,
        username: post.author.username ?? "Anonymous",
        image: post.author.image ?? "",
      },
      likes: post.likes ?? 0,
      comments: post.comments ?? 0,
      isLiked: !!post.isLiked,
      isBookmarked: !!post.isBookmarked,
      _creationTime: post._creationTime,
      location: post.location ?? undefined,
      eventDate: post.eventDate ?? undefined,
      isOwner: post.isOwner ?? false,
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
      <LinearGradient
        colors={["#EFF6FF", "#FFFFFF"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={feedStyles.container}>
          {/* HEADER */}
          <View style={{ position: "relative" }}>
            <AppHeader
              title="Campus Connect 🎓"
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
              renderItem={({ item }) => <Post post={item as any} />}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                feedStyles.postsList,
                { minHeight: height * 0.5 },
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                />
              }
            />
          )}
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

