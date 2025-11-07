import { StyleSheet, Dimensions, Platform } from "react-native";
import { COLORS } from "@/constants/themes";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // HEADER
  header: {
    width: "100%",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  headerContent: {
    paddingTop: Platform.OS === "android" ? hp(3) : hp(2),
  },
  headerWelcome: {
    fontSize: wp(5),
    fontWeight: "700",
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: wp(3.8),
    color: COLORS.white,
    opacity: 0.9,
    marginTop: hp(0.5),
  },

  // CATEGORY
  categoryContainer: {
    marginTop: hp(1),
    marginBottom: hp(1.5),
  },
  categoryScroll: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: wp(4.5),
    paddingVertical: hp(1.1),
    borderRadius: wp(6),
    marginRight: wp(3),
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: wp(4.3),
    marginRight: wp(1.2),
  },
  categoryText: {
    fontSize: wp(3.8),
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.white,
  },

  // POSTS
  postsList: {
    paddingHorizontal: wp(0),
    paddingBottom: hp(12),
  },

  // EMPTY STATE
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: wp(4.8),
    color: COLORS.primary,
    fontWeight: "600",
  },
});
