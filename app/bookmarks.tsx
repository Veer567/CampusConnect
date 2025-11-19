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
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import AppHeader from "@/components/AppHeader";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Toast from "react-native-toast-message";

// Responsive helpers
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

// ────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────────
export default function Bookmarks() {
  // ✅ Fetch user bookmarks from Convex
  const bookmarks = useQuery(api.bookmark.getBookmarks);
  const toggleBookmark = useMutation(api.bookmark.toggleBookmark);

  // ─────────────── SHARE HANDLER ───────────────
  const handleShare = async (item: any) => {
    try {
      await Share.share({
        message: `📌 ${item.title}\n📅 ${item.eventDate || "TBA"}\n📍 ${
          item.location || "Unknown"
        }`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // ─────────────── REMOVE BOOKMARK HANDLER ───────────────
  const handleRemoveBookmark = async (postId: Id<"posts">) => {
    try {
      await toggleBookmark({ postId }); // Removes the bookmark
      Toast.show({
        type: "info",
        text1: "Removed from bookmarks ❌",
        position: "bottom",
        visibilityTime: 1500,
      });
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  // ─────────────── RENDER ───────────────
  return (
    <LinearGradient
      colors={["#EFF6FF", "#FFFFFF"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <AppHeader title="Bookmarks" rightIcon="bookmark" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {bookmarks === undefined ? (
            // Loading state
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color={COLORS.grey} />
              <Text style={styles.emptyText}>Loading bookmarks...</Text>
            </View>
          ) : bookmarks.length > 0 ? (
            bookmarks.map((item: any) => (
              <View key={item._id} style={styles.card}>
                {/* Event image */}
                {item.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} style={styles.image} />
                )}

                {/* Card content */}
                <View style={styles.cardContent}>
                  <Text style={styles.title}>{item.title}</Text>

                  {/* Event date */}
                  {item.eventDate && (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.infoText}>{item.eventDate}</Text>
                    </View>
                  )}

                  {/* Event location */}
                  {item.location && (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.infoText}>{item.location}</Text>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.actions}>
                    {/* Share Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleShare(item)}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.shareButton}
                      >
                        <Ionicons name="share-outline" size={18} color="#fff" />
                        <Text style={styles.shareText}>Share</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Remove Bookmark Button */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        handleRemoveBookmark(item._id as Id<"posts">)
                      }
                    >
                      <Ionicons
                        name="bookmark"
                        size={22}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            // Empty state
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={64} color={COLORS.grey} />
              <Text style={styles.emptyText}>No bookmarks yet</Text>
            </View>
          )}
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(10),
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: wp(4),
    marginBottom: hp(2),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#f0f0f0",
    marginTop: hp(2),
  },
  image: {
    width: "100%",
    height: hp(23),
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
  },
  cardContent: {
    padding: wp(4),
  },
  title: {
    fontSize: wp(4.5),
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: hp(0.5),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(0.3),
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: wp(3.5),
    marginLeft: wp(1.5),
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp(1.5),
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: wp(3),
  },
  shareText: {
    color: "#fff",
    fontSize: wp(3.5),
    fontWeight: "600",
    marginLeft: wp(2),
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: hp(15),
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: wp(4),
    marginTop: hp(2),
  },
});
