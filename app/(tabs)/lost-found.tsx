// app/(tabs)/lost-found.tsx
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useProfileImageCache } from "@/hooks/useProfileImageCache";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import ActionSheet from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { COLORS } from "@/constants/themes";
import { StatusBar } from "expo-status-bar";

/**
 * NOTE: you uploaded two sample images earlier; included as fallbacks.
 * Developer note: uploaded file path(s) available in conversation:
 *   /mnt/data/9f283b40-577e-431e-bb73-41b517de1473.png
 *   /mnt/data/a1903931-2540-4e0a-8519-dd8d2e2a9649.png
 */
const FALLBACK_IMG_1 = "/mnt/data/9f283b40-577e-431e-bb73-41b517de1473.png";
const FALLBACK_IMG_2 = "/mnt/data/a1903931-2540-4e0a-8519-dd8d2e2a9649.png";

const STATUS_FILTERS = ["All", "Lost", "Found"] as const;
const CATEGORY_FILTERS = [
  "All",
  "Electronics",
  "Books",
  "Accessories",
  "Clothes",
  "Other",
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

// modal action types used by the fullscreen confirmation modal
type ConfirmAction = "delete" | "reunite" | "markFound" | null;

export default function LostFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId: clerkId } = useAuth();
  const actionSheetRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] =
    useState<(typeof CATEGORY_FILTERS)[number]>("All");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // fullscreen confirmation modal state (TikTok-style with color accent header)
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmItem, setConfirmItem] = useState<any | null>(null);
  const confirmAnim = useRef(new Animated.Value(0)).current;

  // current user (Convex)
  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  // lost items (server supports optional status filter)
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

  // stats (optional)
  const stats = useQuery(api.lostItems.getLostFoundStats) ?? {
    foundCount: 0,
    lostCount: 0,
    reunitedCount: 0,
  };

  // mutations
  const getOrStartConv = useMutation(api.chat.getOrStartConversation);
  const markFoundMut = useMutation(api.lostItems.markItemFound);
  const markReunitedMut = useMutation(api.lostItems.markItemReunited);
  const deleteLostItemMutation = useMutation(
    (api.lostItems as any).deleteLostItem
  );

  // filtered list (client-side search + category)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lostItems.filter((item: any) => {
      if (
        categoryFilter !== "All" &&
        (item.category ?? "Other") !== categoryFilter
      )
        return false;
      if (q.length > 0) {
        return (
          (item.title || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.location || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [lostItems, categoryFilter, search]);

  // action sheet helpers (edit/delete/status)
  const openItemOptions = (item: any) => {
    setSelectedItem(item);
    actionSheetRef.current?.show();
  };

  const handleEditSelected = () => {
    actionSheetRef.current?.hide();
    if (selectedItem) router.push(`/edit-lost-item?id=${selectedItem._id}`);
  };

  const handleDeleteSelected = () => {
    actionSheetRef.current?.hide();
    if (!selectedItem) return;
    // use confirm modal (reuses same modal with action 'delete')
    setConfirmItem(selectedItem);
    setConfirmAction("delete");
    openConfirmModal();
  };



  // open confirm modal animation
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

  // card-level quick actions (owner-only buttons)
  const onCardOwnerMarkFound = (item: any) => {
    setConfirmItem(item);
    setConfirmAction("reunite"); // per your requirement — "I found it" should remove the post
    openConfirmModal();
  };

  const onCardOwnerReturnToOwner = (item: any) => {
    setConfirmItem(item);
    setConfirmAction("reunite");
    openConfirmModal();
  };

  // perform confirm action
  const performConfirmAction = async () => {
    if (!confirmAction || !confirmItem) {
      closeConfirmModal();
      return;
    }

    try {
      if (confirmAction === "delete") {
        await deleteLostItemMutation({ id: confirmItem._id });
      } else if (confirmAction === "markFound") {
        // server-side will validate reporter etc.
        await markFoundMut({ id: confirmItem._id });
      } else if (confirmAction === "reunite") {
        // record reunited event and delete the item (server handles)
        await markReunitedMut({ id: confirmItem._id });
      }
    } catch (err) {
      Alert.alert("Error", String((err as Error)?.message || err));
    } finally {
      // close modal & reset
      closeConfirmModal();
    }
  };

  // Create press animation + navigation to add screen
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
    ]).start(() => router.push("/add"));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primary]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrapper}>
              <Ionicons name="cube-outline" size={22} color="#fff" />
            </View>

            <View style={styles.headerTextSection}>
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

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.statNumber}>
            {(stats.foundCount ?? 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Found</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
          <Text style={styles.statNumber}>
            {(stats.reunitedCount ?? 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Reunited</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons
            name="remove-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.statNumber}>
            {(stats.lostCount ?? 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Lost</Text>
        </View>
      </View>

      {/* Status filters */}
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
                activeOpacity={0.8}
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



      {/* Items list */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <LostItemCard
            item={item}
            me={me}
            onStartChat={getOrStartConv}
            onOpenOptions={() => openItemOptions(item)}
            router={router}
            markFoundMut={markFoundMut}
            markReunitedMut={markReunitedMut}
            onCardOwnerMarkFound={onCardOwnerMarkFound}
            onCardOwnerReturnToOwner={onCardOwnerReturnToOwner}
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

      {/* Floating Add Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          { transform: [{ scale: scaleAnim }], bottom: insets.bottom + 60 },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreatePress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.fabGradient}
          >
            <Text style={styles.fabIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ActionSheet (3-dots) - shows Edit/Delete/Mark found/Reunited */}
      <ActionSheet ref={actionSheetRef}>
        <View style={sheetStyles.sheetContainer}>
          <Text style={sheetStyles.sheetTitle}>Item Options</Text>

          <TouchableOpacity
            style={sheetStyles.sheetOption}
            onPress={handleEditSelected}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={sheetStyles.sheetText}>Edit Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={sheetStyles.sheetOption}
            onPress={handleDeleteSelected}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            <Text style={[sheetStyles.sheetText, { color: COLORS.red }]}>
              Delete Item
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={[
              sheetStyles.sheetOption,
              { justifyContent: "center", marginTop: 8 },
            ]}
            onPress={() => actionSheetRef.current?.hide()}
          >
            <Text style={[sheetStyles.sheetText, { fontWeight: "700" }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>

      {/* Fullscreen color-accent confirmation modal (Option C; tap outside closes) */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="none"
        onRequestClose={closeConfirmModal}
      >
        <TouchableWithoutFeedback onPress={closeConfirmModal}>
          <View style={confirmStyles.backdrop}>
            {/* clicking backdrop invokes close */}
          </View>
        </TouchableWithoutFeedback>

        <View style={confirmStyles.centerWrapper} pointerEvents="box-none">
          <Animated.View
            style={[
              confirmStyles.card,
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
            {/* color-accent header */}
            <View style={confirmStyles.headerAccent}>
              <Text style={confirmStyles.headerTitle}>
                {confirmAction === "delete"
                  ? "Delete Item?"
                  : confirmAction === "reunite"
                    ? "Mark Reunited?"
                    : confirmAction === "markFound"
                      ? "Mark as Found?"
                      : "Confirm"}
              </Text>
            </View>

            <View style={confirmStyles.content}>
              <Text style={confirmStyles.message}>
                {confirmAction === "delete"
                  ? "This will permanently delete the post. Are you sure?"
                  : confirmAction === "reunite"
                    ? "This will mark the item as reunited and remove the post. Reunited count will increase."
                    : confirmAction === "markFound"
                      ? "This will update the item status to Found."
                      : ""}
              </Text>

              <View style={confirmStyles.buttonsRow}>
                <TouchableOpacity
                  style={confirmStyles.btnCancel}
                  onPress={closeConfirmModal}
                >
                  <Text style={confirmStyles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={confirmStyles.btnConfirm}
                  onPress={performConfirmAction}
                >
                  <Text style={confirmStyles.btnConfirmText}>
                    {confirmAction === "delete"
                      ? "Delete"
                      : confirmAction === "reunite"
                        ? "Yes, Reunite"
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


function LostItemCard({
  item,
  me,
  onStartChat,
  onOpenOptions,
  router,
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
    try {
      const conv = await onStartChat({ otherUserId: item.reporterId });
      const conversationId =
        typeof conv === "object" && conv && "_id" in conv ? conv._id : conv;
      if (!conversationId || !me?._id) return;
      router.push(
        `/chat-screen?conversationId=${conversationId}&currentUserId=${me._id}&otherUserId=${item.reporterId}`
      );
    } catch (err) {
      console.error("Start chat error:", err);
    }
  };

  return (
  
      <View style={cardStyles.card}>
        
        <View style={cardStyles.cardImageContainer}>
          <Image
            source={{ uri: item.imageUrl || FALLBACK_IMG_2 }}
            style={cardStyles.cardImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "transparent"]}
          style={cardStyles.imageGradient}
        />

        <View
          style={[
            cardStyles.statusBadge,
            { backgroundColor: isLost ? "#FF6B9D" : "#10B981" },
          ]}
        >
          <Ionicons
            name={isLost ? "alert-circle" : "checkmark-circle"}
            size={14}
            color="#fff"
          />
          <Text style={cardStyles.statusBadgeText}>
            {isLost ? "Lost" : "Found"}
          </Text>
        </View>


        {/* 3-dots menu (owner-only) - top-right */}
        {isOwner && (
          <TouchableOpacity
            style={cardStyles.topMenuBtn}
            onPress={() => onOpenOptions(item)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={cardStyles.cardContent}>
        <View style={cardStyles.userRowTop}>
          <TouchableOpacity
            onPress={() =>
              router.push(`/other-profile?userId=${item.reporterId}`)
            }
          >
            <Image
              source={{ uri: avatarUri }}
              style={cardStyles.avatar}
              contentFit="cover"
            />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={cardStyles.userName}>
              {userProfile?.fullname || item.reporterName}
            </Text>
            <Text style={cardStyles.timeText}>{createdAgo}</Text>
          </View>

          {/* owner quick actions */}
          {isOwner ? (
            <>
              {isLost ? (
                <TouchableOpacity
                  style={[cardStyles.actionBtn, { backgroundColor: "#FF4F91" }]}
                  onPress={() => onCardOwnerMarkFound(item)}
                >
                  <Ionicons
                    name="sparkles"
                    size={14}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[cardStyles.actionBtnText, { color: "#fff" }]}>
                    I Found It
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[cardStyles.actionBtn, { backgroundColor: "#10B981" }]}
                  onPress={() => onCardOwnerReturnToOwner(item)}
                >
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[cardStyles.actionBtnText, { color: "#fff" }]}>
                    Returned to Owner
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={cardStyles.chatIconBtn}
              onPress={startChat}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text style={cardStyles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.description ? (
          <Text style={cardStyles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={cardStyles.metaContainer}>
          <View style={cardStyles.metaRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={cardStyles.metaText} numberOfLines={1}>
              {item.location || "Unknown location"}
            </Text>
          </View>

          <View style={cardStyles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={cardStyles.metaText}>
              {new Date(item.createdAt).toDateString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* =========================
   Styles
   ========================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextSection: {},
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.9)" },
  sparklesBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  searchWrapper: { marginTop: 8 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "web" ? 12 : 14,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    width: "32%",
    alignItems: "center",
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 6,
  },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  filtersSection: { marginTop: 12, paddingHorizontal: 16 },
  filterScrollContent: { paddingVertical: 4, gap: 10 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  filterTextActive: { color: "#fff" },

  categoriesSection: { marginTop: 10, paddingHorizontal: 12 },
  categoryScrollContent: { paddingVertical: 4, gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  categoryTextActive: { color: COLORS.primary, fontWeight: "600" },

  listContent: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 140 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  fabContainer: { position: "absolute", right: 24 },
  fab: { width: 62, height: 62, borderRadius: 31, overflow: "hidden" },
  fabGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fabIcon: { fontSize: 32, color: "#fff", fontWeight: "300" },
});

/* card styles */
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  cardImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  cardImage: { width: "100%", height: "100%" },
  imageGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  statusBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  categoryBadge: {
    position: "absolute",
    top: 12,
    right: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "600", color: COLORS.text },

  topMenuBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  cardContent: { padding: 14 },
  userRowTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
  },
  userName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  timeText: { fontSize: 12, color: COLORS.textSecondary },

  chatIconBtn: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 30,
    backgroundColor: "#EEF4FF",
  },
  menuBtn: { marginLeft: 10, padding: 8, borderRadius: 30 },

  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    flexDirection: "row",
  },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.text },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 8,
  },
  cardDescription: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },

  metaContainer: { flexDirection: "row", marginTop: 10, gap: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
});

/* Action sheet styles */
const sheetStyles = StyleSheet.create({
  sheetContainer: { padding: 20, backgroundColor: "#fff" },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: COLORS.text,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  sheetText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
});

/* Confirm modal styles (color-accent header — you chose Royal Blue #3B82F6) */
const confirmStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  centerWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerAccent: {
    backgroundColor: "#3B82F6", // Royal Blue (Option 4)
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  content: { padding: 18 },
  message: { fontSize: 15, color: "#222", marginBottom: 18, lineHeight: 20 },
  buttonsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  btnCancelText: { color: "#333", fontWeight: "700" },
  btnConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
  },
  btnConfirmText: { color: "#fff", fontWeight: "800" },
});
