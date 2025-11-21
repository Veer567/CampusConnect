import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import AppHeader from "@/components/AppHeader";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

// Responsive helpers
const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

// ────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────────
export default function Bookmarks() {
  const router = useRouter();

  // Fetch bookmarks
  const bookmarks = useQuery(api.bookmark.getBookmarks);
  const toggleBookmark = useMutation(api.bookmark.toggleBookmark);

  const handleRemoveBookmark = async (postId: Id<"posts">) => {
    try {
      await toggleBookmark({ postId });
      Toast.show({
        type: "info",
        text1: "Removed from bookmarks",
        position: "bottom",
      });
    } catch (error) {
      console.error("Bookmark remove error:", error);
    }
  };

  return (
    <LinearGradient
      colors={["#F8FAFF", "#FFFFFF"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <AppHeader title="Bookmarks" rightIcon="bookmark" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* LOADING */}
          {bookmarks === undefined && (
            <View style={styles.emptyBox}>
              <Ionicons name="time-outline" size={48} color={COLORS.grey} />
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          )}

          {/* EMPTY */}
          {bookmarks?.length === 0 && bookmarks !== undefined && (
            <View style={styles.emptyBox}>
              <Ionicons name="bookmark-outline" size={60} color={COLORS.grey} />
              <Text style={styles.emptyText}>No bookmarks yet</Text>
            </View>
          )}

          {/* LIST */}
          {bookmarks?.map((item: any) => (
            <TouchableOpacity
              key={item._id}
              activeOpacity={0.9}
              style={styles.card}
              onPress={() =>
                router.push(`/post-details?postId=${item._id}`)
              }
            >
              {/* Thumbnail */}
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, { backgroundColor: "#ccc" }]} />
              )}

              {/* Content */}
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>

                {item.eventDate ? (
                  <View style={styles.row}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.meta}>{item.eventDate}</Text>
                  </View>
                ) : null}

                {item.location ? (
                  <View style={styles.row}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.meta}>{item.location}</Text>
                  </View>
                ) : null}
              </View>

              {/* Remove */}
              <TouchableOpacity
                onPress={() => handleRemoveBookmark(item._id)}
                style={styles.removeBtn}
              >
                <Ionicons
                  name="bookmark"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Toast />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: wp(5),
    paddingTop: 10,
    paddingBottom: 30,
  },

  /* EMPTY */
  emptyBox: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 10,
  },

  /* CARD */
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    alignItems: "center",
    elevation: 2,
  },

  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#eee",
  },

  info: {
    flex: 1,
    marginLeft: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },

  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },

  removeBtn: {
    padding: 4,
  },
});
