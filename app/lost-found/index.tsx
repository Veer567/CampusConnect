// app/lost-found/LostFoundScreen.tsx

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useProfileImageCache } from "@/hooks/useProfileImageCache";
import { styles } from "@/styles/lost.styles";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import ActionSheet from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Alert,
  Animated,
  BackHandler,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { COLORS } from "@/constants/themes";

const FALLBACK_IMG_1 = "/mnt/data/9f283b40-577e-431e-bb73-41b517de1473.png";
const FALLBACK_IMG_2 = "/mnt/data/a1903931-2540-4e0a-8519-dd8d2e2a9649.png";

const STATUS_FILTERS = ["All", "Lost", "Found"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type ConfirmAction = "delete" | "reunite" | "markFound" | null;

export default function LostFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId: clerkId } = useAuth();

  const actionSheetRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmItem, setConfirmItem] = useState<any | null>(null);
  const confirmAnim = useRef(new Animated.Value(0)).current;

  // *************** ANDROID BACK FIX ***************
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.push({ pathname: "/(tabs)" }); // Go to Home Tab instead of exiting
        return true; // Prevent exiting the app
      };

      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => sub.remove();
    }, [])
  );
  // ************************************************

  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  const lostItems =
    useQuery(api.lostItems.getLostItems, {
      status:
        statusFilter === "Lost"
          ? "lost"
          : statusFilter === "Found"
            ? "found"
            : undefined,
      limit: 200,
    }) ?? [];

  const stats = useQuery(api.lostItems.getLostFoundStats) ?? {
    foundCount: 0,
    lostCount: 0,
    reunitedCount: 0,
  };

  const getOrStartConv = useMutation(api.chat.getOrStartConversation);
  const markFoundMut = useMutation(api.lostItems.markItemFound);
  const markReunitedMut = useMutation(api.lostItems.markItemReunited);
  const deleteLostItemMutation = useMutation(
    (api.lostItems as any).deleteLostItem
  );

  // Filtered search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lostItems.filter((item: any) => {
      if (q.length > 0) {
        return (
          (item.title || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.location || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [lostItems, search]);

  const openItemOptions = (item: any) => {
    setSelectedItem(item);
    actionSheetRef.current?.show();
  };

  const handleEditSelected = () => {
    actionSheetRef.current?.hide();
    if (selectedItem) router.push(`/lost-found/edit?id=${selectedItem._id}`);
  };

  const handleDeleteSelected = () => {
    actionSheetRef.current?.hide();
    if (!selectedItem) return;

    setConfirmItem(selectedItem);
    setConfirmAction("delete");
    openConfirmModal();
  };

  function openConfirmModal() {
    setConfirmVisible(true);
    Animated.timing(confirmAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }

  function closeConfirmModal() {
    Animated.timing(confirmAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => setConfirmVisible(false));

    setConfirmAction(null);
    setConfirmItem(null);
  }

  const performConfirmAction = async () => {
    if (!confirmAction || !confirmItem) {
      closeConfirmModal();
      return;
    }

    try {
      if (confirmAction === "delete") {
        await deleteLostItemMutation({ id: confirmItem._id });
      } else if (confirmAction === "markFound") {
        await markFoundMut({ id: confirmItem._id });
      } else if (confirmAction === "reunite") {
        await markReunitedMut({ id: confirmItem._id });
      }
    } catch (err) {
      Alert.alert("Error", String(err));
    } finally {
      closeConfirmModal();
    }
  };

  const handleCreatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => router.push("/lost-found/add"));
  };

  // ************** UI START **************
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primary]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrapper}>
              <Ionicons name="cube-outline" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Lost & Found</Text>
              <Text style={styles.headerSubtitle}>Help find missing items</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.sparklesBtn}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <TextInput
              placeholder="Search items..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      </LinearGradient>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.statNumber}>{stats.foundCount}</Text>
          <Text style={styles.statLabel}>Found</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
          <Text style={styles.statNumber}>{stats.reunitedCount}</Text>
          <Text style={styles.statLabel}>Reunited</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons
            name="remove-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.statNumber}>{stats.lostCount}</Text>
          <Text style={styles.statLabel}>Lost</Text>
        </View>
      </View>

      {/* STATUS FILTERS */}
      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {STATUS_FILTERS.map((s) => {
            const isActive = statusFilter === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Ionicons
                  name={
                    s === "Lost"
                      ? "alert-circle-outline"
                      : s === "Found"
                        ? "checkmark-circle-outline"
                        : "albums-outline"
                  }
                  size={16}
                  color={isActive ? "#fff" : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ITEMS LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <LostItemCard
            item={item}
            me={me}
            onStartChat={getOrStartConv}
            onOpenOptions={() => openItemOptions(item)}
            router={router}
            markFoundMut={markFoundMut}
            markReunitedMut={markReunitedMut}
            onCardOwnerMarkFound={(itm: any) => {
              setConfirmItem(itm);
              setConfirmAction("reunite");
              openConfirmModal();
            }}
            onCardOwnerReturnToOwner={(itm: any) => {
              setConfirmItem(itm);
              setConfirmAction("reunite");
              openConfirmModal();
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="cube-outline"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting filters or be the first to report an item
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <Animated.View
        style={[
          styles.fabContainer,
          { transform: [{ scale: scaleAnim }], bottom: insets.bottom + 60 },
        ]}
      >
        <TouchableOpacity
          onPress={handleCreatePress}
          style={{
            backgroundColor: COLORS.primary,
            paddingHorizontal: 15,
            paddingVertical: 15,
            borderRadius: 30,
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* ACTION SHEET */}
      <ActionSheet ref={actionSheetRef}>
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Item Options</Text>

          <TouchableOpacity
            style={styles.sheetOption}
            onPress={handleEditSelected}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sheetText}>Edit Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetOption}
            onPress={handleDeleteSelected}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            <Text style={[styles.sheetText, { color: COLORS.red }]}>
              Delete Item
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetOption, { justifyContent: "center" }]}
            onPress={() => actionSheetRef.current?.hide()}
          >
            <Text style={[styles.sheetText, { fontWeight: "700" }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>

      {/* CONFIRM MODAL */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="none"
        onRequestClose={closeConfirmModal}
      >
        <TouchableWithoutFeedback onPress={closeConfirmModal}>
          <View style={styles.confirmBackdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.confirmCenter}>
          <Animated.View
            style={[
              styles.confirmCard,
              {
                transform: [
                  {
                    scale: confirmAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
                opacity: confirmAnim,
              },
            ]}
          >
            <View style={styles.confirmHeader}>
              <Text style={styles.headerTitle}>
                {confirmAction === "delete"
                  ? "Delete Item?"
                  : confirmAction === "reunite"
                    ? "Mark Reunited?"
                    : "Confirm"}
              </Text>
            </View>

            <View style={styles.confirmContent}>
              <Text style={styles.confirmMessage}>
                {confirmAction === "delete"
                  ? "This will permanently delete the post."
                  : confirmAction === "reunite"
                    ? "This will remove the post and increase 'Reunited' count."
                    : ""}
              </Text>

              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmCancel}
                  onPress={closeConfirmModal}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmConfirm}
                  onPress={performConfirmAction}
                >
                  <Text style={styles.confirmConfirmText}>
                    {confirmAction === "delete"
                      ? "Delete"
                      : confirmAction === "reunite"
                        ? "Reunite"
                        : "Confirm"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
// END MAIN SCREEN

// **********************************
// ITEM CARD COMPONENT
// **********************************

function LostItemCard({
  item,
  me,
  router,
  onStartChat,
  onOpenOptions,
  markFoundMut,
  markReunitedMut,
  onCardOwnerMarkFound,
  onCardOwnerReturnToOwner,
}: any) {
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

  const startChat = async (e?: any) => {
    e?.stopPropagation?.();
    if (isOwner) return;

    const conv = await onStartChat({ otherUserId: item.reporterId });
    const conversationId =
      typeof conv === "object" && conv && "_id" in conv ? conv._id : conv;

    if (conversationId && me?._id)
      router.push(
        `/chat-screen?conversationId=${conversationId}&currentUserId=${me._id}&otherUserId=${item.reporterId}`
      );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardImageContainer}>
        <Image
          source={{ uri: item.imageUrl || FALLBACK_IMG_2 }}
          style={styles.cardImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "transparent"]}
          style={styles.imageGradient}
        />

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

        {isOwner && (
          <TouchableOpacity
            style={styles.topMenuBtn}
            onPress={() => onOpenOptions(item)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.userRowTop}>
          <TouchableOpacity
            onPress={() =>
              router.push(`/other-profile?userId=${item.reporterId}`)
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

          {isOwner ? (
            isLost ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#FF4F91" }]}
                onPress={() => onCardOwnerMarkFound(item)}
              >
                <Ionicons
                  name="sparkles"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                  I Found It
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
                onPress={() => onCardOwnerReturnToOwner(item)}
              >
                <Ionicons
                  name="checkmark"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                  Returned
                </Text>
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

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

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
