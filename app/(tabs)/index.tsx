import { Loader } from "@/components/Loader";
import Post from "@/components/Posts";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
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

// --- Categories ---
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

  // --- Fetch posts ---
  const postsQuery = useQuery(api.posts.getFeedPosts);
  const posts = postsQuery || [];

  // --- Map posts to match PostProps ---
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

  // --- Animated category button scales ---
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

  // --- Filter posts based on selected category ---
  const filteredPosts = useMemo(() => {
    if (selectedCategory.name === "All") return mappedPosts;
    return mappedPosts.filter(
      (post) => post.category === selectedCategory.name
    );
  }, [mappedPosts, selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  // --- Loading / empty states ---
  if (!postsQuery) return <Loader />;
  if (mappedPosts.length === 0) return <NoPostsFound />;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { flex: 1, backgroundColor: COLORS.background },
        ]}
      >
        {/* HEADER */}
        <View style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
          <Text
            style={{ fontSize: 22, color: COLORS.white, fontWeight: "600" }}
          >
            Welcome Back <Text style={{ fontWeight: "700" }}>👋</Text>
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 2 }}>
            Discover campus events
          </Text>
        </View>

        {/* CATEGORY FILTER */}
        <View style={{ marginBottom: 10 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 6,
              alignItems: "center",
            }}
            decelerationRate={Platform.OS === "ios" ? "fast" : 0.9}
            snapToAlignment="start"
          >
            {categories.map((cat, index) => {
              const isActive = selectedCategory.id === cat.id;
              return (
                <Animated.View
                  key={cat.id}
                  style={{
                    transform: [{ scale: categoryScales[index] }],
                    marginRight: 14,
                    shadowColor: isActive ? COLORS.primary : "transparent",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isActive ? 0.4 : 0,
                    shadowRadius: 6,
                    elevation: isActive ? 6 : 0,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 24,
                      backgroundColor: isActive
                        ? COLORS.primary
                        : COLORS.surface,
                      borderWidth: isActive ? 0 : 1,
                      borderColor: "black",
                    }}
                  >
                    <Text style={{ marginRight: 8, fontSize: 16 }}>
                      {cat.icon}
                    </Text>
                    <Text
                      style={{
                        color: isActive ? COLORS.white : COLORS.grey,
                        fontWeight: "600",
                        fontSize: 15,
                      }}
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
          contentContainerStyle={{
            paddingBottom: 80,
            paddingHorizontal: 10,
          }}
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

// --- No posts screen ---
const NoPostsFound = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: COLORS.background,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Text style={{ fontSize: 20, color: COLORS.primary }}>No posts yet</Text>
  </View>
);
