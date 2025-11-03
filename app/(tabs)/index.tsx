import { Loader } from "@/components/Loader";
import Post from "@/components/Posts";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { styles } from "../../styles/feed.styles";
import { StatusBar } from "expo-status-bar";

// ── Categories ───────────────────────────────
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

  const postsQuery = useQuery(api.posts.getFeedPosts);
  const posts = postsQuery || [];

  const mappedPosts = useMemo(
    () =>
      posts.map((post) => ({
        _id: post._id,
        title: post.title || "",
        content: post.caption || "",
        category: post.category || "Other",
        imageUrl: post.imageUrl,
        author: {
          username: post.author.username,
          image: post.author.image,
        },
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
        speed: 25,
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
      <SafeAreaView style={styles.container}>
         <StatusBar style="dark" />
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerWelcome}>
            Welcome Back <Text style={{ fontSize: 22 }}>👋</Text>
          </Text>
          <Text style={styles.headerSubtitle}>Discover campus events</Text>
        </View>

        {/* CATEGORY FILTER */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
            decelerationRate={Platform.OS === "ios" ? "fast" : 0.9}
          >
            {categories.map((cat, index) => {
              const isActive = selectedCategory.id === cat.id;
              return (
                <Animated.View
                  key={cat.id}
                  style={{
                    transform: [{ scale: categoryScales[index] }],
                    marginRight: 14,
                  }}
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

        {/* POSTS */}
        <FlatList
          data={filteredPosts}
          renderItem={({ item }) => <Post post={item} />}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ── No Posts Placeholder ─────────────────────
const NoPostsFound = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No posts yet</Text>
  </View>
);
