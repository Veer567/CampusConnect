import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
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

interface PostDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  post: {
    title: string;
    caption?: string;
    imageUrl?: string;
    eventDate?: string;
    location?: string;
    likes: number;
    comments: number;
    isLiked: boolean;
    isBookmarked: boolean;
    handleLike: () => void;
    handleBookmark: () => void;
    openComments: () => void;
  };
}


export default function PostDetailsModal({
  visible,
  onClose,
  post,
}: PostDetailsModalProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* 🔹 Background Gradient (faster than BlurView) */}
      {visible && (
        <LinearGradient
          colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.4)"]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* 🔹 Animated Modal Card */}
      <Animated.View
        style={[
          styles.modalWrapper,
          {
            opacity: fadeAnim,
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
          },
        ]}
      >
        <SafeAreaView style={styles.cardContainer}>
          <StatusBar
            barStyle={Platform.OS === "ios" ? "light-content" : "default"}
            translucent
          />

          {/* 🔸 Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={26} color={COLORS.text} />
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
              <TouchableOpacity
                onPress={post.handleLike}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={post.isLiked ? "heart" : "heart-outline"}
                  size={25}
                  color={post.isLiked ? COLORS.red : COLORS.textSecondary}
                />
                <Text style={styles.actionNumber}>{post.likes}</Text>
              </TouchableOpacity>

              {/* 💬 Comment */}
              <TouchableOpacity
                onPress={post.openComments}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={23}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.actionNumber}>{post.comments}</Text>
              </TouchableOpacity>

              {/* 🔖 Bookmark */}
              <TouchableOpacity
                onPress={post.handleBookmark}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
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
            {post.caption && (
              <Text style={styles.caption} selectable>
                {post.caption}
              </Text>
            )}

            {/* Meta Info (Date & Location) */}
            {(post.eventDate || post.location) && (
              <View style={styles.metaSection}>
                {post.eventDate && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {post.eventDate}
                    </Text>
                  </View>
                )}
                {post.location && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                    <Text
                      style={styles.metaValue}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {post.location}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

/*──────────────────────────────
   🎨 STYLES (Optimized & Responsive)
──────────────────────────────*/
const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(3),
  },
  cardContainer: {
    width: "100%",
    maxWidth: 420,
    maxHeight: height * 0.9,
    backgroundColor: COLORS.surface,
    borderRadius: wp(5),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === "ios" ? 0.25 : 0.3,
    shadowRadius: 12,
    elevation: 14,
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? hp(2.5) : hp(3),
    right: wp(4),
    zIndex: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    padding: wp(1.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  scrollContainer: {
    paddingTop: wp(20),
    paddingBottom: wp(6),
    paddingHorizontal: wp(5),
  },
  title: {
    fontSize: wp(4.8),
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: wp(3),
    lineHeight: wp(6),
  },
  image: {
    width: "100%",
    height: hp(25),
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
    alignItems: "flex-start",
    gap: wp(2),
    marginBottom: wp(1.5),
  },
  metaValue: {
    flex: 1,
    fontSize: wp(3.5),
    color: COLORS.textSecondary,
    lineHeight: wp(5),
  },
});
