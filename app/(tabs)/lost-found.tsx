// app/(tabs)/lost-found.tsx
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useProfileImageCache } from "@/hooks/useProfileImageCache";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";

import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ActionSheet from "react-native-actions-sheet";

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

const STATUS_FILTERS = ["All", "Lost", "Found"] as const;
const CATEGORY_FILTERS = [
  "All",
  "Electronics",
  "Books",
  "Accessories",
  "Clothes",
  "Other",

] as const;

export default function LostFoundScreen() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const actionSheetRef = useRef<any>(null);

  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("All");
  const [categoryFilter, setCategoryFilter] =
    useState<(typeof CATEGORY_FILTERS)[number]>("All");
  const [search, setSearch] = useState("");

  // item currently selected (for action sheet)
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  /** Load current Convex user (skip until clerkId exists) */
  const me = useQuery(api.users.getUserByClerkId, clerkId ? { clerkId } : "skip");

  /** Lost items */
  const statusParam =
    statusFilter === "Lost" ? "lost" : statusFilter === "Found" ? "found" : undefined;
  const lostItems =
    useQuery(api.lostItems.getLostItems, { status: statusParam, limit: 200 }) ?? [];

  /** Filtered view */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lostItems.filter((item: any) => {
      if (categoryFilter !== "All" && (item.category ?? "Other") !== categoryFilter)
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

  // mutation helpers
  const getOrStartConv = useMutation(api.chat.getOrStartConversation);

  // delete mutation — guard if not present in generated api
  // (the generated `api.lostItems.deleteLostItem` may be undefined; guard to avoid runtime error)
  const deleteLostItemMutation = (api.lostItems as any).deleteLostItem
    ? useMutation((api.lostItems as any).deleteLostItem)
    : null;

  // Handlers for action sheet actions
  const openItemOptions = (item: any) => {
    setSelectedItem(item);
    actionSheetRef.current?.show();
  };

  const handleEditSelected = () => {
    actionSheetRef.current?.hide();
    if (!selectedItem) return;
    router.push(`/edit-lost-item?id=${selectedItem._id}`);
  };

  const handleDeleteSelected = () => {
    actionSheetRef.current?.hide();
    if (!selectedItem) return;

    Alert.alert("Delete item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (deleteLostItemMutation) {
              await deleteLostItemMutation({ id: selectedItem._id } as any);
            } else {
              // fallback: try calling generic mutation if not present
              console.warn("deleteLostItem mutation not found in api.lostItems");
            }
            // success — the Convex subscription / query will reflect removal
          } catch (err) {
            console.error("Delete failed", err);
            Alert.alert("Delete failed", String((err as Error)?.message || err));
          }
        },
      },
    ]);
  };
// Lost & Found 📦
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Lost & Found 📦</Text>
        <Text style={styles.headerSubtitle}>Help each other find items</Text>
      </View>

      {/* Search Box */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          placeholder="Search items..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* STATUS FILTERS */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATUS_FILTERS.map((s) => {
            const isActive = statusFilter === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
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
                  size={18}
                  color={isActive ? COLORS.white : COLORS.textSecondary}
                  style={styles.categoryIcon}
                />
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CATEGORY FILTERS */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORY_FILTERS.map((c) => {
            const isActive = categoryFilter === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCategoryFilter(c)}
                style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    c === "Electronics"
                      ? "phone-portrait-outline"
                      : c === "Books"
                      ? "book-outline"
                      : c === "Accessories"
                      ? "wallet-outline"
                      : "pricetag-outline"
                  }
                  size={18}
                  color={isActive ? COLORS.white : COLORS.textSecondary}
                  style={styles.categoryIcon}
                />
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* MAIN LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 12 }}
        renderItem={({ item }) => (
          <LostItemCard
            item={item}
            me={me}
            onStartChat={getOrStartConv}
            onOpenOptions={() => openItemOptions(item)}
            router={router}
          />
        )}
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingAddBtn} onPress={() => router.push("/add")}>
        <Ionicons name="add-circle" size={60} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Shared ActionSheet (Edit / Delete) */}
      <ActionSheet ref={actionSheetRef}>
        <View style={sheetStyles.sheetContainer}>
          <Text style={sheetStyles.sheetTitle}>Item Options</Text>

          <TouchableOpacity style={sheetStyles.sheetOption} onPress={handleEditSelected}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={sheetStyles.sheetText}>Edit Item</Text>
          </TouchableOpacity>

          <TouchableOpacity style={sheetStyles.sheetOption} onPress={handleDeleteSelected}>
            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            <Text style={[sheetStyles.sheetText, { color: COLORS.red }]}>Delete Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[sheetStyles.sheetOption, { justifyContent: "center", marginTop: 10 }]}
            onPress={() => actionSheetRef.current?.hide()}
          >
            <Text style={[sheetStyles.sheetText, { fontWeight: "700" }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>
    </SafeAreaView>
  );
}

/* -------------------------
    Lost item card (uses hooks)
    ------------------------- */
function LostItemCard({
  item,
  me,
  onStartChat,
  onOpenOptions,
  router,
}: {
  item: any;
  me: any;
  onStartChat: any;
  onOpenOptions: () => void;
  router: any;
}) {
  // 🎯 Fetch original profile (LIVE)
  const userProfile = useQuery(api.users.getUserProfile, {
    id: item.reporterId as Id<"users">,
  });

  // smooth refresh when user updates profile
  const cache = useProfileImageCache(String(item.reporterId));

  // real user profile image → fallback to stored reporterImage → fallback default
  const avatarUri = userProfile?.image
    ? `${userProfile.image}?t=${cache}`
    : item.reporterImage
    ? `${item.reporterImage}?t=${cache}`
    : "https://i.pravatar.cc/300";

  const createdAgo = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
  });

  const startChat = async () => {
    try {
      const conv = await onStartChat({
        otherUserId: item.reporterId as Id<"users">,
      });

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

  const isOwner = me && item.reporterId && String(me._id) === String(item.reporterId);

  return (
    <View style={cardStyles.card}>
      {/* USER HEADER ROW */}
      <View style={cardStyles.userRow}>
        <TouchableOpacity onPress={() => router.push(`/other-profile?userId=${item.reporterId}`)}>
          <Image source={{ uri: avatarUri }} style={cardStyles.avatar} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={cardStyles.userName}>{userProfile?.fullname || item.reporterName}</Text>
          <Text style={cardStyles.timeText}>{createdAgo}</Text>
        </View>

        {/* CHAT */}
        <TouchableOpacity onPress={startChat} style={cardStyles.chatIconBtn}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        {/* EDIT / DELETE — OWNER ONLY */}
        {isOwner && (
          <TouchableOpacity onPress={onOpenOptions} style={cardStyles.menuBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ITEM IMAGE */}
      <Image source={{ uri: item.imageUrl || undefined }} style={cardStyles.itemImage} />

      <Text style={cardStyles.itemTitle}>{item.title}</Text>

      {item.description && <Text style={cardStyles.itemDesc}>{item.description}</Text>}

      <View style={cardStyles.metaRow}>
        <Ionicons name="location-outline" size={16} color="#555" />
        <Text style={cardStyles.metaText}>{item.location || "Unknown"}</Text>
      </View>

      <View style={cardStyles.metaRow}>
        <Ionicons name="calendar-outline" size={16} color="#555" />
        <Text style={cardStyles.metaText}>{new Date(item.createdAt).toDateString()}</Text>
      </View>
    </View>
  );
}

/* -------------------------
    Styles
    ------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FC" },
  headerBox: { padding: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#222" },
  headerSubtitle: { fontSize: 14, color: "#666", marginTop: 4 },

  searchBox: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    marginBottom: 12,
  },
  searchInput: { marginLeft: 10, flex: 1, color: "#333" },

  categoryContainer: {
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: wp(2),
  },
  categoryScroll: {
    paddingHorizontal: wp(2),
    paddingVertical: 4,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: wp(4.5),
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: wp(3),
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryIcon: { marginRight: wp(1.2) },
  categoryText: {
    fontSize: wp(3.8),
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  categoryTextActive: { color: COLORS.white },

  floatingAddBtn: {
    position: "absolute",
    bottom: 75,
    right: 20,
    
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 14,
    borderRadius: 12,
    elevation: 3,
  },
  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: "700", color: "#222" },
  timeText: { fontSize: 12, color: "#777" },
  chatIconBtn: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: "#EEF4FF",
    borderRadius: 30,
    elevation: 1,
  },
  menuBtn: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 30,
  },
  itemImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#eee",
  },
  itemTitle: { fontSize: 18, fontWeight: "700", color: "#222" },
  itemDesc: { color: "#555", marginTop: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  metaText: { marginLeft: 6, color: "#444" },
});

const sheetStyles = StyleSheet.create({
  sheetContainer: {
    padding: 20,
    backgroundColor: "#fff",
  },
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
