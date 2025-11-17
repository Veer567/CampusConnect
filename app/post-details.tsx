// app/post-details.tsx

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export default function PostDetailsScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams();

  // Fetch post from Convex
  const post = useQuery(api.posts.getFeedPosts)?.find(
    (p: any) => p._id === postId
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the screen just like modal
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!post) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.surface,
        }}
      >
        <Text style={{ fontSize: 18, color: COLORS.text }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.4)"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [
            {
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        }}
      >
        <SafeAreaView style={styles.cardContainer}>
          <StatusBar translucent barStyle="light-content" />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color={COLORS.text} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {/* Title */}
            <Text style={styles.title} numberOfLines={3}>
              {post.title}
            </Text>

            {/* Image */}
            {post.imageUrl && (
              <Image
                source={{ uri: post.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {/* ❤️ Like */}
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                <Ionicons
                  name={post.isLiked ? "heart" : "heart-outline"}
                  size={25}
                  color={post.isLiked ? COLORS.red : COLORS.textSecondary}
                />
                <Text style={styles.actionNumber}>{post.likes}</Text>
              </TouchableOpacity>

              {/* 💬 Comments */}
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                <Ionicons
                  name="chatbubble-outline"
                  size={23}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.actionNumber}>{post.comments}</Text>
              </TouchableOpacity>

              {/* 🔖 Bookmark */}
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                <Ionicons
                  name={post.isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={25}
                  color={
                    post.isBookmarked ? COLORS.primary : COLORS.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Caption */}
            {post.caption && <Text style={styles.caption}>{post.caption}</Text>}

            {/* Meta Section */}
            {(post.eventDate || post.location) && (
              <View style={styles.metaSection}>
                {post.eventDate && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.metaValue}>{post.eventDate}</Text>
                  </View>
                )}
                {post.location && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.metaValue}>{post.location}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

/*──────────────────────────────
   🎨 STYLES (same as modal)
──────────────────────────────*/
const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: wp(5),
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? hp(2.5) : hp(4),
    left: wp(4),
    zIndex: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    padding: wp(1.5),
    elevation: 4,
  },
  scrollContainer: {
    paddingTop: wp(20),
    paddingBottom: wp(6),
    paddingHorizontal: wp(5),
  },
  title: {
    fontSize: wp(5),
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: wp(3),
    lineHeight: wp(6),
  },
  image: {
    width: "100%",
    height: hp(28),
    borderRadius: wp(4),
    marginBottom: wp(3),
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(5),
    marginBottom: wp(2),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
  },
  actionNumber: {
    fontSize: wp(3.4),
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: wp(3.6),
    color: COLORS.textSecondary,
    lineHeight: wp(5.2),
    marginBottom: wp(4),
    textAlign: "justify",
  },
  metaSection: {
    backgroundColor: COLORS.background,
    borderRadius: wp(3),
    paddingVertical: wp(3),
    paddingHorizontal: wp(4),
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: wp(2),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
    marginBottom: wp(1.5),
  },
  metaValue: {
    fontSize: wp(3.5),
    color: COLORS.textSecondary,
    flex: 1,
  },
});
