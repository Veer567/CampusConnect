import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface PostProps {
  post: {
    _id: string;
    title: string;
    content: string;
    category: string;
    imageUrl?: string;
    author: {
      username: string;
      image?: string;
    };
    eventDate?: string;
    location?: string;
  };
}

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

export default function Post({ post }: PostProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {post.author.image ? (
            <Image
              source={{ uri: post.author.image }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[styles.avatar, { backgroundColor: COLORS.grey + "30" }]}
            />
          )}

          <View>
            <Text style={styles.username}>{post.author.username}</Text>
            <Text style={styles.timeAgo}>2d ago</Text>
          </View>
        </View>

        {/* Gradient Category Badge */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.categoryBadge}
        >
          <Ionicons name="bookmark-outline" size={12} color={COLORS.white} />
          <Text style={styles.categoryText}>{post.category}</Text>
        </LinearGradient>
      </View>

      {/* Title & Content */}
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.description} numberOfLines={3}>
        {post.content}
      </Text>

      {/* Image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Date & Location */}
      {(post.eventDate || post.location) && (
        <View style={styles.metaRow}>
          {post.eventDate && (
            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>{post.eventDate}</Text>
            </View>
          )}
          {post.location && (
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>{post.location}</Text>
            </View>
          )}
        </View>
      )}

      {/* Stats Row */}
      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <Ionicons
            name="heart-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <Text style={styles.actionText}>234</Text>
        </View>
        <View style={styles.actionItem}>
          <Ionicons
            name="chatbubble-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <Text style={styles.actionText}>46</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: wp(4),
    marginVertical: wp(2.5),
    marginHorizontal: wp(4),
    padding: wp(4),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: wp(3),
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    marginRight: wp(2.5),
  },
  username: {
    fontSize: wp(3.9),
    fontWeight: "700",
    color: COLORS.text,
  },
  timeAgo: {
    fontSize: wp(3),
    color: COLORS.textSecondary,
  },

  // GRADIENT CATEGORY BADGE
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2.2),
    paddingVertical: wp(1),
    borderRadius: wp(5),
  },
  categoryText: {
    fontSize: wp(3),
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 4,
  },

  // TITLE & DESCRIPTION
  title: {
    fontSize: wp(4.5),
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: wp(1),
  },
  description: {
    fontSize: wp(3.7),
    color: COLORS.textSecondary,
    lineHeight: wp(5),
    marginBottom: wp(3),
  },

  // IMAGE
  image: {
    width: "100%",
    height: wp(55),
    borderRadius: wp(3),
    marginBottom: wp(3),
  },

  // META INFO
  metaRow: {
    flexDirection: "row",
    marginBottom: wp(3),
    alignItems: "center",
    gap: wp(4),
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
  },
  metaText: {
    fontSize: wp(3.4),
    color: COLORS.textSecondary,
  },

  // ACTIONS
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: wp(2.5),
    gap: wp(6),
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
  },
  actionText: {
    fontSize: wp(3.4),
    fontWeight: "500",
    color: COLORS.text,
  },
});
