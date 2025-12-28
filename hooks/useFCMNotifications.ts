import { useAuth } from "@clerk/clerk-expo";
import messaging from "@react-native-firebase/messaging";
import { useMutation } from "convex/react";
import { useEffect } from "react";

import { api } from "@/convex/_generated/api";

export default function useFCMNotifications() {
  const { isLoaded, isSignedIn } = useAuth();
  const saveFcmToken = useMutation(api.pushTokens.saveFcmToken);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let unsubMessage: (() => void) | undefined;
    let unsubRefresh: (() => void) | undefined;

    async function initFCM() {
      try {
        /* 1️⃣ Request permission */
        const status = await messaging().requestPermission();
        const enabled =
          status === messaging.AuthorizationStatus.AUTHORIZED ||
          status === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log("🔕 FCM permission denied");
          return;
        }

        /* 2️⃣ Get token */
        const token = await messaging().getToken();
        if (token) {
          await saveFcmToken({ token });
          console.log("✅ FCM token saved");
        }

        /* 3️⃣ Token refresh */
        unsubRefresh = messaging().onTokenRefresh(async (newToken) => {
          await saveFcmToken({ token: newToken });
          console.log("🔄 FCM token refreshed");
        });

        /* 4️⃣ Foreground messages */
        unsubMessage = messaging().onMessage(async (remoteMessage) => {
          console.log("📩 Foreground FCM:", {
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            data: remoteMessage.data,
          });
        });
      } catch (err) {
        console.error("❌ FCM init failed:", err);
      }
    }

    initFCM();

    return () => {
      unsubMessage?.();
      unsubRefresh?.();
    };
  }, [isLoaded, isSignedIn]);

  return null;
}
