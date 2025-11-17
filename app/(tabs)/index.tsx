// FEED SCREEN — FULL FIXED VERSION

import AppHeader from "@/components/AppHeader";
import { Loader } from "@/components/Loader";
import Post from "@/components/Posts";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
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

  // ✅ Correct: directly use Convex reactive query (NO LOCAL COPY)
  const posts = useQuery(api.posts.getFeedPosts) || [];

  // ✅ Map posts — include author._id so new cache-buster works
  const mappedPosts = useMemo(
    () =>
      posts.map((post) => ({
        _id: post._id,
        title: post.title || "Untitled",
        caption: post.caption || "",
        category: post.category || "Other",
        imageUrl: post.imageUrl ?? undefined,
        author: {
          _id: post.author._id, // 🔥 IMPORTANT FOR CACHE-BUSTER
          username: post.author.username || "Anonymous",
          image: post.author.image ?? "",
        },
        likes: post.likes ?? 0,
        comments: post.comments ?? 0,
        _creationTime: post._creationTime,
        isLiked: !!post.isLiked,
        isBookmarked: !!post.isBookmarked,
        location: post.location ?? undefined,
        eventDate: post.eventDate ?? undefined,
        isOwner: post.isOwner ?? false,
      })),
    [posts]
  );

  // Category animation
  const categoryScales = categories.map(() => new Animated.Value(1));

  const filteredPosts = useMemo(() => {
    if (selectedCategory.name === "All") return mappedPosts;
    return mappedPosts.filter(
      (post) => post.category === selectedCategory.name
    );
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
          <AppHeader title="Campus Connect 🎓" alignLeft />

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
