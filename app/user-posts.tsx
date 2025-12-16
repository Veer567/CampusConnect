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
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const GAP = 6; // spacing between tiles
const IMAGE_SIZE = (width - GAP * 4) / 3; // fully responsive 3-grid layout

export default function UserPosts() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const posts = useQuery(api.posts.getPostsByUser, {
    userId: userId === "me" ? undefined : (userId as any),
  });

  if (!posts) return null;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <AppHeader
        title="Posts"
        showBackButton={true}
        onBackPress={() => router.replace("/profile")}
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
              activeOpacity={0.85}
              style={styles.card}
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

/*──────────────────────────
        ⭐ STYLES
──────────────────────────*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  emptyBox: {
    marginTop: 120,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  gridContainer: {
    paddingHorizontal: GAP,
    paddingTop: 8,
    paddingBottom: 20,
  },

  card: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: GAP,
    borderRadius: 12,
    backgroundColor: "#f3f3f3",
    overflow: "hidden",

    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },

    // Android elevation
    elevation: Platform.OS === "android" ? 3 : 0,
  },

  image: {
    width: "100%",
    height: "100%",
  },
});
