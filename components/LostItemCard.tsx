// components/LostItemCard.tsx

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useProfileImageCache } from "@/hooks/useProfileImageCache";
import { formatDistanceToNow } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { styles } from "@/styles/lost.styles";

// Local fallback images
const FALLBACK_IMG_1 = "/mnt/data/9f283b40-577e-431e-bb73-41b517de1473.png";
const FALLBACK_IMG_2 = "/mnt/data/a1903931-2540-4e0a-8519-dd8d2e2a9649.png";


export interface LostItemCardProps {
  item: any;
  me: any;
  navigation: any;
  onStartChat: (opts: { otherUserId: string }) => Promise<any>;
  onOpenOptions: (item: any) => void;
  markFoundMut: any;
  markReunitedMut: any;
  onCardOwnerMarkFound: (item: any) => void;
  onCardOwnerReturnToOwner: (item: any) => void;
}

export default function LostItemCard({
  item,
  me,
  navigation,
  onStartChat,
  onOpenOptions,
  markFoundMut,
  markReunitedMut,
  onCardOwnerMarkFound,
  onCardOwnerReturnToOwner,
}: LostItemCardProps) {
  
  // Fetch reporter profile
  const userProfile = useQuery(api.users.getUserProfile, {
    id: item.reporterId as Id<"users">,
  });

  const cache = useProfileImageCache(String(item.reporterId));

  const avatarUri = userProfile?.image
    ? `${userProfile.image}?t=${cache}`
    : item.reporterImage
    ? `${item.reporterImage}?t=${cache}`
    : FALLBACK_IMG_1;

  const createdAgo = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
  });

  const isOwner = me?._id && String(me._id) === String(item.reporterId);
  const isLost = item.status === "lost";

  // Open chat
  const startChat = async () => {
    if (isOwner) return;
    const conv = await onStartChat({ otherUserId: item.reporterId });

    const conversationId = typeof conv === "object" ? conv._id : conv;

    navigation.navigate("ChatScreen", {
      conversationId,
      currentUserId: me._id,
      otherUserId: item.reporterId,
    });
  };

  return (
    <View style={styles.card}>
      {/* IMAGE */}
      <View style={styles.cardImageContainer}>
        <Image
          source={{ uri: item.imageUrl || FALLBACK_IMG_2 }}
          style={styles.cardImage}
          contentFit="cover"
        />

        {/* STATUS BADGE */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isLost ? "#FF6B9D" : "#10B981" },
          ]}
        >
          <Ionicons
            name={isLost ? "alert-circle" : "checkmark-circle"}
            size={14}
            color="#fff"
          />
          <Text style={styles.statusBadgeText}>
            {isLost ? "Lost" : "Found"}
          </Text>
        </View>

        {/* MENU BUTTON (ONLY OWNER) */}
        {isOwner && (
          <TouchableOpacity
            style={styles.topMenuBtn}
            onPress={() => onOpenOptions(item)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* CONTENT */}
      <View style={styles.cardContent}>
        {/* USER ROW */}
        <View style={styles.userRowTop}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("OtherProfile", {
                userId: item.reporterId,
              })
            }
          >
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              contentFit="cover"
            />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.userName}>
              {userProfile?.fullname || item.reporterName}
            </Text>
            <Text style={styles.timeText}>{createdAgo}</Text>
          </View>

          {/* ACTION BUTTON RIGHT SIDE */}
          {isOwner ? (
            isLost ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#FF4F91" }]}
                onPress={() => onCardOwnerMarkFound(item)}
              >
                <Ionicons name="sparkles" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>I Found It</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
                onPress={() => onCardOwnerReturnToOwner(item)}
              >
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Returned</Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity style={styles.chatIconBtn} onPress={startChat}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* TITLE */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* DESCRIPTION */}
        {!!item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* META INFO */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location || "Unknown location"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.metaText}>
              {new Date(item.createdAt).toDateString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
