import { COLORS } from "@/constants/themes";
import { Dimensions ,Platform,StyleSheet } from "react-native";


const { width: W, height: H } = Dimensions.get("window");
const wp = (p: number) => (W * p) / 100;
const hp = (p: number) => (H * p) / 100;

export const feedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  headerRightContainer: {
    position: "absolute",
    right: wp(4),
    top: Platform.OS === "android" ? hp(2.25) : hp(1.25),
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
  },

  searchBar: {
    marginTop: hp(1.5),
    marginHorizontal: wp(4),
    backgroundColor: "#f2f2f2",
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.5),
    borderRadius: wp(2.5),
    flexDirection: "row",
    alignItems: "center",
  },
  searchText: {
    marginLeft: wp(2.5),
    fontSize: 16,
    color: "#777",
  },

  categoryContainer: {
    marginTop: hp(1.5),
    marginBottom: hp(1),
    marginHorizontal: wp(2),
  },

  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: wp(6),
    marginRight: wp(3),
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  categoryIcon: {
    fontSize: wp(4.4),
    marginRight: wp(1.5),
  },

  categoryText: {
    fontSize: wp(3.8),
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  categoryTextActive: {
    color: COLORS.white,
  },

  postsList: {
    paddingHorizontal: wp(1),
    paddingBottom: hp(14),
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: wp(5),
    fontWeight: "600",
    color: COLORS.primary,
  },
});
