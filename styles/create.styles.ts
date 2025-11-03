import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "@/constants/themes";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginBottom: 40,
    marginTop: 30,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: COLORS.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    position: "absolute",
    left: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Scroll
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },

  // Category
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
    marginRight: 10,
    marginHorizontal: 9,
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

  // Inputs
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 10,
    marginBottom: 12,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },

  // Image
  imagePicker: {
    height: width * 0.5,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  image: { width: "100%", height: "100%", borderRadius: 16 },
  placeholder: { alignItems: "center" },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },

  // FAB
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 25,
  },
  fab: {
    borderRadius: 50,
    overflow: "hidden",
    elevation: 5,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  fabDisabled: {
    opacity: 0.6,
  },
});
