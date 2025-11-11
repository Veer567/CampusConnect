// ✅ Only relevant changes marked with comments

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

  // ✅ Reactive Convex query
  const postsQuery = useQuery(api.posts.getFeedPosts);
  const posts = postsQuery || [];

  // ✅ Simple mapping (no array length logic)
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
        likes: post.likes ?? 0,
        comments: post.comments ?? 0,
        _creationTime: post._creationTime,
        isLiked: !!post.isLiked,
        isBookmarked: !!post.isBookmarked,
        location: post.location ?? undefined,
        eventDate: post.eventDate ?? undefined,
      })),
    [posts]
  );

  const categoryScales = useMemo(
    () => categories.map(() => new Animated.Value(1)),
    []
  );

  useEffect(() => {
    categories.forEach((cat, index) => {
      Animated.spring(categoryScales[index], {
        toValue: selectedCategory.id === cat.id ? 1.1 : 1,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedCategory]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory.name === "All") return mappedPosts;
    return mappedPosts.filter(
      (post) => post.category === selectedCategory.name
    );
  }, [mappedPosts, selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  if (!postsQuery) return <Loader />;
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
