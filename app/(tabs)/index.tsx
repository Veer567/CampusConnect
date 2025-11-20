// FEED SCREEN — UPDATED WITH CHAT + NOTIFICATIONS BUTTONS

import AppHeader from "@/components/AppHeader";
import { Loader } from "@/components/Loader";
import Post from "@/components/Posts";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

const categories = [
  { id: 0, name: "All", icon: "📄" },
  { id: 1, name: "Placements", icon: "👨‍💼" },
  { id: 2, name: "Workshops", icon: "🛠️" },
  { id: 3, name: "Hackathon", icon: "🚀" },
  { id: 4, name: "Festivals", icon: "🎉" },
  { id: 5, name: "Sports", icon: "🏅" },
  { id: 6, name: "Other", icon: "✨" },
];

export default function Index() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  // Feed posts
  const posts = useQuery(api.posts.getFeedPosts) || [];

  const mappedPosts = useMemo(
    () =>
      posts.map((post) => ({
        _id: post._id,
        title: post.title || "Untitled",
        caption: post.caption || "",
        category: post.category || "Other",
        imageUrl: post.imageUrl ?? undefined,
        author: {
          _id: post.author._id,
          username: post.author.username || "Anonymous",
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

  const categoryScales = categories.map(() => new Animated.Value(1));

  const filteredPosts = useMemo(() => {
    if (selectedCategory.name === "All") return mappedPosts;
    return mappedPosts.filter((p) => p.category === selectedCategory.name);
  }, [mappedPosts, selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  if (!posts) return <Loader />;
  if (mappedPosts.length === 0) return <NoPostsFound />;

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={["#EFF6FF", "#FFFFFF"]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          {/* TOP HEADER WITH CHAT + NOTIFICATION BUTTONS */}
          {/* Custom Header Only for Feed Screen */}
          <View style={{ position: "relative" }}>
            <AppHeader title="Campus Connect 🎓" alignLeft />

            {/* Right-side Icons over Header */}
            <View
              style={{
                position: "absolute",
                right: 16,
                top: 18, // adjust for perfect alignment
                flexDirection: "row",
                alignItems: "center",
                gap: 18,
              }}
            >
              {/* Notifications */}
              <TouchableOpacity onPress={() => router.push("/notifications")}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {/* Chat */}
              <TouchableOpacity onPress={() => router.push("/chat")}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/search")}
            activeOpacity={0.8}
            style={{
              marginTop: 10,
              marginHorizontal: 16,
              backgroundColor: "#f2f2f2",
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="search-outline" size={20} color="#777" />
            <Text style={{ marginLeft: 10, fontSize: 16, color: "#777" }}>
              Search users, posts or #tags...
            </Text>
          </TouchableOpacity>

          {/* Categories */}
          <View style={styles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat, index) => {
                const isActive = selectedCategory.id === cat.id;
                return (
                  <Animated.View
                    key={cat.id}
                    style={{ transform: [{ scale: categoryScales[index] }] }}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.85}
                      style={[
                        styles.categoryButton,
                        isActive && styles.categoryButtonActive,
                      ]}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.categoryText,
                          isActive && styles.categoryTextActive,
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

          {/* Posts Feed */}
          <FlatList
            data={filteredPosts}
            renderItem={({ item }) => <Post post={item} />}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.postsList,
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

const NoPostsFound = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No posts yet</Text>
  </View>
);
