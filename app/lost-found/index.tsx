import { api } from "@/convex/_generated/api";
import { useProfileImageCache } from "@/hooks/useProfileImageCache";
import { styles } from "@/styles/lost.styles";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ActionSheet from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { shimmerStyles as sh } from "../../styles/lost.styles";

import { COLORS } from "@/constants/themes";
import {
  Alert,
  Animated,
  BackHandler,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const FALLBACK_IMG_1 = "/mnt/data/9f283b40-577e-431e-bb73-41b517de1473.png";
const FALLBACK_IMG_2 = "/mnt/data/a1903931-2540-4e0a-8519-dd8d2e2a9649.png";

const STATUS_FILTERS = ["All", "Lost", "Found"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
type ConfirmAction = "delete" | "reunite" | null;

// ==========================================================
// SKELETON COMPONENT
// ==========================================================
function LostItemSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1300,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150], // width of shimmer slide
  });

  const Shimmer = () => (
    <Animated.View
      style={[
        sh.shimmerOverlay,
        {
          transform: [{ translateX }],
        },
      ]}
    />
  );

  return (
    <View style={[styles.card, { opacity: 0.9 }]}>
      {/* Image Block */}
      <View
        style={[
          styles.cardImageContainer,
          sh.shimmerContainer,
          { backgroundColor: "#e5e5e5" },
        ]}
      >
        <Shimmer />
      </View>

      <View style={{ padding: 12 }}>
        {/* Row */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={[
              sh.shimmerContainer,
              {
                height: 40,
                width: 40,
                borderRadius: 20,
                backgroundColor: "#d4d4d4",
              },
            ]}
          >
            <Shimmer />
          </View>

          <View style={{ marginLeft: 10, flex: 1 }}>
            <View
              style={[
                sh.shimmerContainer,
                { height: 12, width: "60%", backgroundColor: "#e0e0e0" },
              ]}
            >
              <Shimmer />
            </View>

            <View
              style={[
                sh.shimmerContainer,
                {
                  marginTop: 6,
                  height: 10,
                  width: "40%",
                  backgroundColor: "#d9d9d9",
                },
              ]}
            >
              <Shimmer />
            </View>
          </View>
        </View>

        {/* Title */}
        <View
          style={[
            sh.shimmerContainer,
            {
              marginTop: 12,
              height: 14,
              width: "80%",
              backgroundColor: "#e0e0e0",
            },
          ]}
        >
          <Shimmer />
        </View>

        {/* Description */}
        <View
          style={[
            sh.shimmerContainer,
            {
              marginTop: 8,
              height: 12,
              width: "90%",
              backgroundColor: "#dadada",
            },
          ]}
        >
          <Shimmer />
        </View>

        {/* Meta */}
        <View style={{ marginTop: 15 }}>
          <View
            style={[
              sh.shimmerContainer,
              {
                height: 10,
                width: "55%",
                backgroundColor: "#e0e0e0",
                marginBottom: 6,
              },
            ]}
          >
            <Shimmer />
          </View>

          <View
            style={[
              sh.shimmerContainer,
              {
                height: 10,
                width: "35%",
                backgroundColor: "#d9d9d9",
              },
            ]}
          >
            <Shimmer />
          </View>
        </View>
      </View>
    </View>
  );
}

// ==========================================================
// MAIN SCREEN
// ==========================================================

export default function LostFoundScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
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

  // BACK FIX
  useFocusEffect(
    React.useCallback(() => {
      const handler = () => {
        router.push("/(tabs)");
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", handler);
      return () => sub.remove();
    }, [])
  );

  const me = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  const lostItems = useQuery(api.lostItems.getLostItems, {
    status:
      statusFilter === "Lost"
        ? "lost"
        : statusFilter === "Found"
          ? "found"
          : undefined,
    limit: 200,
  });

  const isLoading = lostItems === undefined;
  const itemsList = lostItems ?? [];

  const stats = useQuery(api.lostItems.getLostFoundStats) ?? {
    foundCount: 0,
    lostCount: 0,
    reunitedCount: 0,
  };

  const getOrStartConv = useMutation(api.chat.getOrStartConversation);
  const markReunitedMut = useMutation(api.lostItems.markItemReunited);
  const markFoundMut = useMutation(api.lostItems.markItemFound);
  const deleteLostItemMutation = useMutation(
    (api.lostItems as any).deleteLostItem
  );

  // FILTERING
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return itemsList;
    return itemsList.filter((i: any) => {
      return (
        i.title.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q)
      );
    });
  }, [search, itemsList]);

  // ACTION SHEET
  const openItemOptions = (item: any) => {
    setSelectedItem(item);
    actionSheetRef.current?.show();
  };

  const handleEdit = () => {
    actionSheetRef.current?.hide();
    if (!selectedItem) return;
    navigation.navigate("LostFoundEdit", { id: selectedItem._id });
  };

  const handleDelete = () => {
    actionSheetRef.current?.hide();
    setConfirmAction("delete");
    setConfirmItem(selectedItem);
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
      duration: 150,
      useNativeDriver: true,
    }).start(() => setConfirmVisible(false));
  }

  const performConfirmAction = async () => {
    if (!confirmAction || !confirmItem) return closeConfirmModal();

    try {
      if (confirmAction === "delete")
        await deleteLostItemMutation({ id: confirmItem._id });
      else if (confirmAction === "reunite")
        await markReunitedMut({ id: confirmItem._id });
    } catch (e) {
      Alert.alert("Error", String(e));
    }
    closeConfirmModal();
  };

  // CREATE NEW ITEM
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
    ]).start(() => navigation.navigate("LostFoundAdd"));
  };

  // ==========================================================
  // UI
  // ==========================================================
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

        </View>

        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color="#999" />
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

      {/* FILTERS */}
      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[styles.filterChip, active && styles.filterChipActive]}
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
                  color={active ? "#fff" : COLORS.textSecondary}
                />
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* LIST */}
      <FlatList
        data={(isLoading ? [1, 2, 3, 4] : filtered) as any}
        keyExtractor={(item, index) =>
          isLoading ? `skeleton-${index}` : item._id
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          isLoading ? (
            <LostItemSkeleton />
          ) : (
            <LostItemCard
              item={item}
              me={me}
              navigation={navigation}
              onStartChat={getOrStartConv}
              onOpenOptions={() => openItemOptions(item)}
              markFoundMut={markFoundMut}
              markReunitedMut={markReunitedMut}
              onOwnerMarkFound={(itm: any) => {
                setConfirmAction("reunite");
                setConfirmItem(itm);
                openConfirmModal();
              }}
            />
          )
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#999" />
              <Text style={styles.emptyTitle}>No items found</Text>
              <Text style={styles.emptySubtitle}>
                Try another filter or add an item
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <Animated.View
        style={[
          styles.fabContainer,
          { transform: [{ scale: scaleAnim }], bottom: insets.bottom + 70 },
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

          <Pressable style={styles.sheetOption} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sheetText}>Edit Item</Text>
          </Pressable>

          <Pressable style={styles.sheetOption} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            <Text style={[styles.sheetText, { color: COLORS.red }]}>
              Delete Item
            </Text>
          </Pressable>

          <Pressable
            style={[styles.sheetOption, { justifyContent: "center" }]}
            onPress={() => actionSheetRef.current?.hide()}
          >
            <Text style={[styles.sheetText, { fontWeight: "700" }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </ActionSheet>

      {/* CONFIRM MODAL */}
      {/* CONFIRM MODAL */}
      {/* CONFIRM MODAL */}
      <Modal visible={confirmVisible} transparent animationType="none">
        <TouchableWithoutFeedback onPress={closeConfirmModal}>
          <Animated.View
            style={[
              {
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.4)",
              },
              { opacity: confirmAnim },
            ]}
          />
        </TouchableWithoutFeedback>

        <View style={{ justifyContent: "flex-end", flex: 1 }}>
          <Animated.View
            style={[
              {
                backgroundColor: "#fff",
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 32,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              },
              {
                transform: [
                  {
                    translateY: confirmAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [200, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Title */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                textAlign: "center",
                color: COLORS.text,
                marginBottom: 8,
              }}
            >
              {confirmAction === "delete"
                ? "Delete Item?"
                : "Mark as Reunited?"}
            </Text>

            {/* Message */}
            <Text
              style={{
                fontSize: 15,
                textAlign: "center",
                color: COLORS.textSecondary,
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              {confirmAction === "delete"
                ? "This item will be permanently removed."
                : "This will mark the item as reunited."}
            </Text>

            {/* Buttons */}
            <View style={{ gap: 12 }}>
              {/* Confirm */}
              <TouchableOpacity
                style={{
                  backgroundColor:
                    confirmAction === "delete" ? COLORS.red : COLORS.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                }}
                onPress={performConfirmAction}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {confirmAction === "delete" ? "Delete" : "Confirm"}
                </Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: "#f2f2f2",
                }}
                onPress={closeConfirmModal}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================================
// ITEM CARD
// ==========================================================

function LostItemCard({
  item,
  me,
  navigation,
  onStartChat,
  onOpenOptions,
  onOwnerMarkFound,
}: any) {
  const userProfile = useQuery(
    api.users.getUserProfile,
    item.reporterId ? { id: item.reporterId } : "skip"
  );

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

  const handleChat = async () => {
    if (isOwner) return;

    const conv = await onStartChat({ otherUserId: item.reporterId });
    const conversationId = conv?._id ?? conv;

    // FULL SAFETY CHECKS → Prevents ArgumentValidationError
    if (!conversationId) return;
    if (!me?._id) return;
    if (!item.reporterId) return;

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
        />

        <LinearGradient
          colors={["rgba(0,0,0,0.4)", "transparent"]}
          style={styles.imageGradient}
        />

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isLost ? "#FF5A8F" : "#10B981" },
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
              navigation.navigate("OtherProfile", { userId: item.reporterId })
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
              {userProfile?.fullname ?? item.reporterName}
            </Text>
            <Text style={styles.timeText}>{createdAgo}</Text>
          </View>

          {isOwner ? (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: isLost ? "#FF4F91" : "#10B981" },
              ]}
              onPress={() => onOwnerMarkFound(item)}
            >
              <Ionicons
                name={isLost ? "sparkles" : "checkmark"}
                size={14}
                color="#fff"
              />
              <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                {isLost ? "I Found It" : "Returned"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.chatIconBtn} onPress={handleChat}>
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
            <Ionicons name="location-outline" size={14} color="#9ca3af" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location ?? "Unknown"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={styles.metaText}>
              {new Date(item.createdAt).toDateString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
