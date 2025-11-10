// Import essential dependencies and components
import { Loader } from "@/components/Loader";
import Post from "@/components/Posts";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "@/styles/feed.styles";
import AppHeader from "@/components/AppHeader";

// Get device height for dynamic layout calculations
const { height } = Dimensions.get("window");

// List of categories for filtering posts
const categories = [
  { id: 0, name: "All", icon: "📄" },
  { id: 1, name: "Placements", icon: "👨‍💼" },
  { id: 2, name: "Workshops", icon: "🛠️" },
  { id: 3, name: "Hackathon", icon: "🚀" },
  { id: 4, name: "Festivals", icon: "🎉" },
  { id: 5, name: "Sports", icon: "🏅" },
  { id: 6, name: "Other", icon: "✨" },
];

// Main Feed Screen Component
export default function Index() {
  // State management for UI and category filters
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  // Fetch posts from the backend using Convex API
  const postsQuery = useQuery(api.posts.getFeedPosts);
  const posts = postsQuery || [];

  // Transform raw API data into UI-friendly format
const mappedPosts = useMemo(
  () =>
    posts.map((post) => ({
      _id: post._id,
      title: post.title || "Untitled",
      content: post.caption || "",
      category: post.category || "Other",
      imageUrl: post.imageUrl ?? undefined,
      author: {
        username: post.author.username || "Anonymous",
        image: post.author.image ?? "",
      },
      likes: Array.isArray(post.likes) ? post.likes.length : 0,
      comments: Array.isArray(post.comments) ? post.comments.length : 0, // ← This fixes it
      _creationTime: post._creationTime,
      isLiked: !!post.isLiked,
      isBookmarked: !!post.isBookmarked,
      location: post.location ?? undefined,
      eventDate: post.eventDate ?? undefined,
    })),
  [posts]
);

  // Create animated scaling for category buttons when selected
  const categoryScales = useMemo(
    () => categories.map(() => new Animated.Value(1)),
    []
  );

  // Animate category selection changes smoothly
  useEffect(() => {
    categories.forEach((cat, index) => {
      Animated.spring(categoryScales[index], {
        toValue: selectedCategory.id === cat.id ? 1.1 : 1,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedCategory]);

  // Filter posts based on selected category
  const filteredPosts = useMemo(() => {
    if (selectedCategory.name === "All") return mappedPosts;
    return mappedPosts.filter(
      (post) => post.category === selectedCategory.name
    );
  }, [mappedPosts, selectedCategory]);

  // Handle pull-to-refresh interaction
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate network refresh delay
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Show loading indicator while posts are being fetched
  if (!postsQuery) return <Loader />;
  // Display empty state when there are no posts
  if (mappedPosts.length === 0) return <NoPostsFound />;

  // Main feed UI layout
  return (
    <SafeAreaProvider>
      {/* Background gradient for a smooth appearance */}
      <LinearGradient
        colors={["#EFF6FF", "#FFFFFF"]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          {/* Header with app title */}
          <AppHeader title="Campus Connect 🎓" alignLeft />

          {/* Horizontal category filter bar */}
          <View style={styles.categoryContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat, index) => {
                const isActive = selectedCategory.id === cat.id;
                return (
                  <Animated.View
                    key={cat.id}
                    style={{ transform: [{ scale: categoryScales[index] }] }}
                  >
                    {/* Category button */}
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

          {/* Feed Section */}
          <FlatList
            data={filteredPosts}
            renderItem={({ item }) => <Post post={item} />}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.postsList,
              { minHeight: height * 0.5 },
            ]}
            // Enable pull-to-refresh functionality
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

// Component displayed when there are no posts in the feed
const NoPostsFound = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No posts yet</Text>
  </View>
);
