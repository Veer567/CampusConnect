import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const IMAGE_SIZE = (width - 8 * 4) / 3; // responsive 3 grid layout

export default function UserPosts() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const posts = useQuery(api.posts.getPostsByUser, {
    userId: userId === "me" ? undefined : (userId as any),
  });

  if (!posts) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <AppHeader
        title="Posts"
        showBackButton={true}
        onBackPress={() => router.push("/(tabs)/profile")}
      />

      {posts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.gridContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/post-details?postId=${item._id}`)}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyBox: {
    marginTop: 120,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  gridContainer: {
    paddingHorizontal: 6,
    paddingVertical: 10,
  },

  card: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 4,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f2f2f2",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  image: {
    width: "100%",
    height: "100%",
  },
});
