import { StyleSheet, Dimensions, Platform } from "react-native";
import { COLORS } from "@/constants/themes";

const { width, height } = Dimensions.get("window");

// ✅ Responsive scaling helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // 🟦 Header (blue gradient background from screen)
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "android" ? hp(3) : hp(5),
    paddingBottom: hp(3),
    paddingHorizontal: wp(5),
    borderBottomWidth: 0,
    borderBottomColor: COLORS.border,
   
  },
  backBtn: {
    position: "absolute",
    left: wp(5),
    top: Platform.OS === "android" ? hp(3.5) : hp(5),
  },
  headerTitle: {
    fontSize: wp(5.2),
    fontWeight: "700",
    color: COLORS.white,
    marginTop: Platform.OS === "android" ? hp(3) : hp(4),
  },

  // 🧾 Scrollable Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(12),
  },

  // 🏷️ Labels
  label: {
    fontSize: wp(4.2),
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: hp(1),
    marginTop: hp(2),
   
  },

  // 🎯 Category Section
  categoryScroll: {
    paddingVertical: hp(1),
    marginLeft: wp(1.5),
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    marginLeft: wp(1.6),
  },
  categoryIcon: {
    fontSize: wp(4.5),
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

  // 🧩 Input Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: wp(4),
    padding: wp(4.5),
    marginTop: hp(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    fontSize: wp(4),
    color: COLORS.text,
    paddingVertical: hp(1),
    marginBottom: hp(1.5),
  },
  inputMultiline: {
    height: hp(10),
    textAlignVertical: "top",
  },

  // 🖼️ Image Picker
  imagePicker: {
    height: width > 400 ? hp(28) : hp(24),
    backgroundColor: COLORS.surfaceLight,
    borderRadius: wp(4),
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: hp(1.5),
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: wp(4),
  },
  placeholder: {
    alignItems: "center",
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: wp(3.6),
    marginTop: hp(0.8),
  },

  // 🚀 Floating Action Button
  fabContainer: {
    position: "absolute",
    bottom: Platform.OS === "android" ? hp(9) : hp(6),
    right: wp(6),
  },
  fab: {
    borderRadius: 50,
    overflow: "hidden",
    elevation: 6,
  },
  fabGradient: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    justifyContent: "center",
    alignItems: "center",
  },
  fabDisabled: {
    opacity: 0.6,
  },
});
