// FEED SCREEN — WITH BADGE FOR UNREAD NOTIFICATIONS + MESSAGES

import AppHeader from "@/components/AppHeader";
import { Loader } from "@/components/Loader";
import Post from "@/components/Posts";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import usePushNotifications from "@/hooks/usePushNotifications";
import { feedStyles } from "@/styles/feed.styles";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

// Categories list
const categories = [
  { id: 0, name: "All", icon: "📄" },
  { id: 1, name: "Placements", icon: "👨‍💼" },
  { id: 2, name: "Workshops", icon: "🛠️" },
  { id: 3, name: "Hackathon", icon: "🚀" },
  { id: 4, name: "Festivals", icon: "🎉" },
  { id: 5, name: "Sports", icon: "🏅" },
  { id: 6, name: "Other", icon: "✨" },
];

export default function FeedScreen() {
  usePushNotifications();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  /* --------------------------------------------------
     UNREAD COUNTS (Convex auto-updated)
  -------------------------------------------------- */
  const unreadMessages = useQuery(api.chat.getUnreadMessageCount) ?? 0;
  const unreadNotifications = useQuery(api.notifications.getUnreadCount) ?? 0;

  // Fetch posts
  const posts = useQuery(api.posts.getFeedPosts) || [];

  // Map posts for frontend use
  const mappedPosts = useMemo(
    () =>
      posts.map((post) => ({
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
      })),
    [posts]
  );

  // Category animation
  const categoryScales = useRef(
    categories.map(() => new Animated.Value(1))
  ).current;

  // Filter posts by category
  const filteredPosts = useMemo(() => {
    if (selectedCategory.name === "All") return mappedPosts;
    return mappedPosts.filter((p) => p.category === selectedCategory.name);
  }, [mappedPosts, selectedCategory]);

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  if (!posts) return <Loader />;
  if (mappedPosts.length === 0) return <NoPostsFound />;

  return (
    <SafeAreaProvider>
      <LinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={{ flex: 1 }}>
        <SafeAreaView style={feedStyles.container}>
          {/* HEADER */}
          <View style={{ position: "relative" }}>
            <AppHeader
              title="Campus Connect 🎓"
              alignLeft
              showBackButton={false}
            />

            {/* TOP RIGHT ICONS */}
            <View style={feedStyles.headerRightContainer}>
              {/* NOTIFICATION BUTTON */}
              <TouchableOpacity
                style={{ marginRight: 18 }}
                onPress={() => router.push("/notifications")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="white"
                />

                {/* BADGE */}
                {unreadNotifications > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* CHAT BUTTON */}
              <TouchableOpacity onPress={() => router.push("/chat")}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={24}
                  color="white"
                />

                {/* BADGE */}
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

          {/* SEARCH BAR */}
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

          {/* POSTS */}
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
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

/* EMPTY POST COMPONENT */
const NoPostsFound = () => (
  <View style={feedStyles.emptyContainer}>
    <Text style={feedStyles.emptyText}>No posts yet</Text>
  </View>
);

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
