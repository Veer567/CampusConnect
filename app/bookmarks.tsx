import React from "react";
import {
  View,
  Text,

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
import { Loader } from "@/components/Loader";
import { SafeAreaView } from "react-native-safe-area-context";

// Responsive helpers
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export default function Bookmarks() {
  const router = useRouter();

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
              <Ionicons name="time-outline" size={wp(15)} color={COLORS.grey} />
             <Loader />
            </View>
          )}

          {/* EMPTY */}
          {bookmarks?.length === 0 && bookmarks !== undefined && (
            <View style={styles.emptyBox}>
              <Ionicons
                name="bookmark-outline"
                size={wp(18)}
                color={COLORS.grey}
              />
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

                {item.eventDate && (
                  <View style={styles.row}>
                    <Ionicons
                      name="calendar-outline"
                      size={wp(3.6)}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.meta}>{item.eventDate}</Text>
                  </View>
                )}

                {item.location && (
                  <View style={styles.row}>
                    <Ionicons
                      name="location-outline"
                      size={wp(3.6)}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.meta}>{item.location}</Text>
                  </View>
                )}
              </View>

              {/* Remove */}
              <TouchableOpacity
                onPress={() => handleRemoveBookmark(item._id)}
                style={styles.removeBtn}
              >
                <Ionicons name="bookmark" size={wp(6)} color={COLORS.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Toast />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────
// RESPONSIVE STYLES
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(5),
  },

  // EMPTY VIEW
  emptyBox: {
    alignItems: "center",
    marginTop: hp(15),
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: wp(4),
    marginTop: hp(1.5),
  },

  // CARD
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: wp(3.5),
    padding: wp(3),
    marginBottom: hp(1.8),
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: wp(2),
  },

  thumb: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(2.5),
    backgroundColor: "#eee",
  },

  info: {
    flex: 1,
    marginLeft: wp(3),
  },

  title: {
    fontSize: wp(4),
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: hp(0.4),
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(0.3),
  },

  meta: {
    fontSize: wp(3.3),
    color: COLORS.textSecondary,
    marginLeft: wp(1),
  },

  removeBtn: {
    padding: wp(1),
  },
});
