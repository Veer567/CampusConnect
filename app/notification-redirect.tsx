import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

/**
 * Central redirect screen for notifications
 * Used for push notifications & deep links
 */
export default function NotificationRedirect() {
  const params = useLocalSearchParams<{
    type?: string;
    postId?: string;
    userId?: string;
    senderId?: string;
    conversationId?: string;
  }>();

  useEffect(() => {
    let redirected = false;

    // -----------------------------
    // MESSAGE → CHAT
    // -----------------------------
    if (
      params.type === "message" &&
      (params.conversationId || params.senderId)
    ) {
      router.replace({
        pathname: "/chat-screen",
        params: {
          conversationId: params.conversationId,
          otherUserId: params.senderId,
        },
      });
      redirected = true;
    }

    // -----------------------------
    // COMMENT / MENTION → POST
    // -----------------------------
    else if (
      (params.type === "comment" || params.type === "mention") &&
      params.postId
    ) {
      router.replace({
        pathname: "/post-details",
        params: {
          postId: params.postId,
          scrollTo: "comments",
        },
      });
      redirected = true;
    }

    // -----------------------------
    // FOLLOW → PROFILE
    // -----------------------------
    else if (params.type === "follow" && params.userId) {
      router.replace({
        pathname: "/other-profile",
        params: { userId: params.userId },
      });
      redirected = true;
    }

    // -----------------------------
    // GENERIC POST
    // -----------------------------
    else if (params.type === "post" && params.postId) {
      router.replace({
        pathname: "/post-details",
        params: { postId: params.postId },
      });
      redirected = true;
    }

    // -----------------------------
    // FALLBACK → NOTIFICATIONS
    // -----------------------------
    if (!redirected) {
      router.replace("/notifications");
    }
  }, [params]);

}
