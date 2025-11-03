import { StyleSheet, Dimensions, Platform } from "react-native";
import { COLORS } from "@/constants/themes";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  // ── Container ───────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
    marginTop: Platform.OS === "android" ? 25 : 0,
  },

  // ── Header ───────────────────────────────
  header: {
    marginBottom: 10,
  },
  headerWelcome: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 4,
  },

  // ── Category Filter ───────────────────────
  filterContainer: {
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 5,
    paddingVertical: 6,
    alignItems: "center",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 17,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.white,
  },

  // ── Posts List ───────────────────────────────
  postsList: {
    paddingBottom: 100,
  },

  // ── Post Card ───────────────────────────────
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginVertical: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postUsername: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.text,
    marginHorizontal: 14,
    marginTop: 4,
  },
  postCategory: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.primary,
    marginHorizontal: 14,
    marginBottom: 6,
  },
  postDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    height: width * 0.7,
    borderRadius: 12,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  likesText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  // ── Empty State ───────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
