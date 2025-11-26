import { COLORS } from "@/constants/themes";
import { Dimensions, Platform, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export const styles = StyleSheet.create({
  /* ----------------------------- MAIN CONTAINER ----------------------------- */
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* --------------------------------- HEADER -------------------------------- */
  header: {
    paddingHorizontal: 20,
    paddingBottom: 50, // was 10 → pushes background lower
  },

  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  sparklesBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* --------------------------------- SEARCH -------------------------------- */
  searchWrapper: {
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "web" ? 12 : 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },

  /* ---------------------------------- STATS --------------------------------- */
  /* ---------------------------------- STATS --------------------------------- */
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginHorizontal: 6,

    // shadow
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  statNumber: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 4,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  /* ------------------------------ FILTER CHIPS ------------------------------ */
  filtersSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },

  filterScrollContent: {
    paddingVertical: 4,
    gap: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F2F4F7",
    marginRight: 10,
  },

  filterChipActive: {
    backgroundColor: COLORS.primary,
  },

  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  filterTextActive: {
    color: "#fff",
  },

  /* ---------------------------------- LIST --------------------------------- */
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 160,
  },

  /* -------------------------------- EMPTY STATE ----------------------------- */
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

  /* ---------------------------------- FAB ---------------------------------- */
  fabContainer: {
    position: "absolute",
    right: 24,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fabIcon: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "300",
  },

  /* ------------------------------- CARD STYLES ------------------------------ */
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
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

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
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  topMenuBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  cardContent: {
    padding: 14,
  },
  userRowTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  chatIconBtn: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 30,
    backgroundColor: "#EEF4FF",
  },

  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  metaContainer: {
    flexDirection: "row",
    marginTop: 10,
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  /* ----------------------------- ACTION SHEET ------------------------------ */
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

  /* ------------------------------ CONFIRM MODAL ---------------------------- */
  confirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  confirmCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  confirmCard: {
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
  confirmHeader: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  confirmHeaderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  confirmContent: {
    padding: 18,
  },
  confirmMessage: {
    fontSize: 15,
    color: "#222",
    marginBottom: 18,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  confirmCancelText: {
    color: "#333",
    fontWeight: "700",
  },
  confirmConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
  },
  confirmConfirmText: {
    color: "#fff",
    fontWeight: "800",
  },
});

export const shimmerStyles = StyleSheet.create({
    shimmerContainer: {
    overflow: "hidden",
    backgroundColor: "#e0e0e0",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "40%",
    backgroundColor: "rgba(255,255,255,0.45)",
  },
})


