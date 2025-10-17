import { COLORS } from "@/constants/themes";
import { Dimensions, Platform, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({


  // General Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop:30
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  container4: {
    paddingHorizontal: 20,
    paddingVertical: 1,
    backgroundColor: "#0D0D0D",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 1,
    marginHorizontal: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.primary,
  },

  // Stories
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  storyWrapper: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 72,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 4,
  },
  noStory: {
    borderColor: COLORS.grey,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  storyUsername: {
    fontSize: 11,
    color: COLORS.white,
    textAlign: "center",
  },

  // Filter / Categories
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surface,
    backgroundColor: COLORS.background,
  },
  categoryScroll: {
    paddingRight: 15,
    paddingLeft: 15,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.white,
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  // Posts
  post: {
    marginBottom: 16,
  },
  postContainer: {
    backgroundColor: COLORS.surface,
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 4,
  },
  postCategory: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.primary,
    marginBottom: 6,
  },
  postDescription: {
    fontSize: 14,
    color: "#A1A1A1",
  },
  postImage: {
    width: width,
    height: width,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  postActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  postInfo: {
    paddingHorizontal: 12,
  },
  likesText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 6,
  },

  // Captions
  captionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  captionUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    marginRight: 6,
  },
  captionText: {
    fontSize: 14,
    color: COLORS.white,
    flex: 1,
  },

  // Comments
  commentsText: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.grey,
    marginBottom: 8,
  },
  commentsList: {
    flex: 1,
  },
  commentContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surface,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: COLORS.white,
    fontWeight: "500",
    marginBottom: 4,
  },
  commentText: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
  },
  commentTime: {
    color: COLORS.grey,
    fontSize: 12,
    marginTop: 4,
  },
  commentInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.surface,
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    fontSize: 14,
  },
  postButton: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },

  // Modal
  modalContainer: {
    backgroundColor: COLORS.background,
    marginBottom: Platform.OS === "ios" ? 44 : 0,
    flex: 1,
    marginTop: Platform.OS === "ios" ? 44 : 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surface,
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },

  // Texts
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  wave: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#A1A1A1",
    marginTop: 2,
  },

  // Centered
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
});
