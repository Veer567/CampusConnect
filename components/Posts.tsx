import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/constants/themes";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
  };
}

export default function Post({ post }: PostProps) {
  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Link href="/(tabs)/notifications">
          <TouchableOpacity style={styles.postHeaderLeft}>
            {post.author.image && (
              <Image
                source={{ uri: post.author.image }}
                style={styles.postAvatar}
                resizeMode="cover"
              />
            )}
            <Text style={styles.postUsername}>{post.author.username}</Text>
          </TouchableOpacity>
        </Link>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={COLORS.white}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Post Content */}
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent}>{post.content}</Text>
      <Text style={styles.postCategory}>{post.category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 15,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  postUsername: {
    color: COLORS.white,
    fontWeight: "600",
  },
  postImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 6,
  },
  postCategory: {
    fontSize: 12,
    color: COLORS.grey,
    fontWeight: "600",
  },
});
