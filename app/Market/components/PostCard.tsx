import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { ActionSheetRef } from "react-native-actions-sheet";
import ActionSheet from "react-native-actions-sheet";
import CommentsModal from "../../../components/CommentsModal";
import { COLORS } from "../../../constants/themes";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

type Props = {
  post: {
    _id: string;
    title: string;
    description: string;
    creatorId: string;
    creatorName: string;
    creatorImage?: string;
    createdAt: number;
    tags?: string[];
    imageUrl?: string;
    type: string;
    location?: string;
  interestedUsers?: (
  | {
      _id: string;
      fullname: string;
      image?: string;
    }
  | null
)[];
  };
  onLearnMore?: (post?: any) => void;
  interestedAvatars?: string[];
  currentUserId?: string;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
};

export default function PostCard({
  post,
  onLearnMore,
  interestedAvatars = [],
  currentUserId,
  onEdit,
  onDelete,
}: Props) {
  const isSelf = post.creatorId === currentUserId;
  const actionSheetRef = useRef<ActionSheetRef>(null);

  const [commentsVisible, setCommentsVisible] = useState(false);

  const handleEditSelected = () => {
    actionSheetRef.current?.hide();
    onEdit?.(post._id);
  };

  const handleDeleteSelected = () => {
    actionSheetRef.current?.hide();
    onDelete?.(post._id);
  };

  /* ============================================================
     CARD UI
  ============================================================= */

  return (
    <>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.wrapper}
      >
        <Pressable
          onPress={() => onLearnMore?.(post)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
        >
          {/* OPTIONS BUTTON */}
          {isSelf && (
            <View style={styles.actionBar}>
              <Pressable onPress={() => actionSheetRef.current?.show()}>
                <Ionicons
                  name="ellipsis-vertical"
                  size={20}
                  color={COLORS.text}
                />
              </Pressable>
            </View>
          )}

          {/* HEADER IMAGE */}
          {post.imageUrl && (
            <View style={styles.imageWrap}>
              <Image source={{ uri: post.imageUrl }} style={styles.image} />
              <LinearGradient
                colors={["rgba(0,0,0,0.28)", "transparent"]}
                start={[0, 0]}
                end={[0, 0.6]}
                style={styles.imageGradient}
              />
            </View>
          )}

          {/* CONTENT */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {post.title}
            </Text>

            <Text style={styles.description} numberOfLines={2}>
              {post.description}
            </Text>

            {/* TAGS */}
            <View style={styles.tagsRow}>
              {(post.tags ?? []).slice(0, 6).map((t) => (
                <View key={t} style={styles.chip}>
                  <Text style={styles.chipText}>{t}</Text>
                </View>
              ))}
            </View>

            {/* META ROW */}
            <View style={styles.metaRow}>
              {/* LEFT: CREATOR */}
              <View style={styles.creatorRow}>
                {post.creatorImage ? (
                  <Image
                    source={{ uri: post.creatorImage }}
                    style={styles.creatorAvatar}
                  />
                ) : (
                  <View style={styles.creatorAvatarPlaceholder}>
                    <Text style={styles.creatorInitial}>
                      {(post.creatorName?.charAt(0) ?? "U").toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.creatorName}>{post.creatorName}</Text>
                  <Text style={styles.creatorMeta}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* RIGHT: INTERESTED MEMBERS + COMMENTS */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* INTERESTED AVATARS */}
                <View style={styles.avatarRow}>
                  {interestedAvatars.slice(0, 4).map((img, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: img || "https://i.pravatar.cc/300" }}
                      style={styles.smallAvatar}
                    />
                  ))}

                  {interestedAvatars.length > 4 && (
                    <View style={styles.moreCircle}>
                      <Text style={styles.moreText}>
                        +{interestedAvatars.length - 4}
                      </Text>
                    </View>
                  )}
                </View>

                {/* COMMENT BUTTON */}
                <TouchableOpacity
                  onPress={() => setCommentsVisible(true)}
                  style={styles.iconBtn}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </MotiView>

      {/* ACTION SHEET */}
      <ActionSheet ref={actionSheetRef} gestureEnabled>
        <View style={sheetStyles.sheetContainer}>
          <Text style={sheetStyles.sheetTitle}>Post Options</Text>

          <TouchableOpacity
            style={sheetStyles.sheetOption}
            onPress={handleEditSelected}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={sheetStyles.sheetText}>Edit Post</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={sheetStyles.sheetOption}
            onPress={handleDeleteSelected}
          >
            <Ionicons name="trash-outline" size={20} color="red" />
            <Text style={[sheetStyles.sheetText, { color: "red" }]}>
              Delete Post
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              sheetStyles.sheetOption,
              { justifyContent: "center", marginTop: 10 },
            ]}
            onPress={() => actionSheetRef.current?.hide()}
          >
            <Text style={[sheetStyles.sheetText, { fontWeight: "700" }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>

      {/* COMMENTS MODAL */}
      <CommentsModal
        targetId={post._id as unknown as Id<"marketplacePosts">}
        targetType="marketplace"
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
      />
    </>
  );
}

/* ============================================================
   STYLES
============================================================ */
const styles = StyleSheet.create({
  wrapper: { width: CARD_WIDTH, alignSelf: "center", marginVertical: 8 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
  },
  cardPressed: { transform: [{ translateY: 1 }] },

  actionBar: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 6,
    borderRadius: 20,
  },

  imageWrap: { width: "100%", height: 170 },
  image: { width: "100%", height: "100%" },
  imageGradient: { position: "absolute", width: "100%", height: "100%" },

  content: { padding: 14 },

  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  description: { color: COLORS.textSecondary, marginTop: 4 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },

  chip: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { color: COLORS.text },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  creatorRow: { flexDirection: "row" },
  creatorAvatar: { width: 44, height: 44, borderRadius: 22 },
  creatorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  creatorInitial: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  creatorName: { fontSize: 14, fontWeight: "700" },
  creatorMeta: { fontSize: 12, color: COLORS.textSecondary },

  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: -6,
    borderWidth: 2,
    borderColor: "#fff",
  },

  moreCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  moreText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    marginLeft: 8,
  },
});

/* ============================================================
   ACTION SHEET STYLES
============================================================ */
export const sheetStyles = StyleSheet.create({
  sheetContainer: {
    padding: 20,
    backgroundColor: COLORS.surface,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: COLORS.text,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  sheetText: {
    fontSize: 16,
    color: COLORS.text,
  },
});
