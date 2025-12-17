import { useEffect } from "react";
import messaging from "@react-native-firebase/messaging";
import { useMutation } from "convex/react";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

import { api } from "@/convex/_generated/api";

export default function useFCMNotifications() {
  const { isLoaded, isSignedIn } = useAuth();
  const saveFcmToken = useMutation(api.pushTokens.saveFcmToken);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      // ⏳ Wait until Clerk is ready
      return;
    }

    let unsubscribeOnMessage: any;
    let unsubscribeOnOpen: any;
    let unsubscribeOnTokenRefresh: any;

    async function initFCM() {
      /* 1️⃣ Permission */
      const status = await messaging().requestPermission();
      const enabled =
        status === messaging.AuthorizationStatus.AUTHORIZED ||
        status === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log("❌ FCM permission denied");
        return;
      }

      /* 2️⃣ Get token */
      const token = await messaging().getToken();
      if (token) {
        console.log("🔥 FCM Token:", token);
        await saveFcmToken({ token });
      }

      /* 3️⃣ Token refresh */
      unsubscribeOnTokenRefresh = messaging().onTokenRefresh(
        async (newToken) => {
          console.log("🔄 Token refreshed:", newToken);
          await saveFcmToken({ token: newToken });
        }
      );

      /* 4️⃣ Foreground messages */
      unsubscribeOnMessage = messaging().onMessage(
        async (remoteMessage) => {
          console.log("📩 Foreground message:", remoteMessage);
        }
      );

      /* 5️⃣ Background open */
      unsubscribeOnOpen = messaging().onNotificationOpenedApp(
        (remoteMessage) => {
          handleNavigation(remoteMessage.data);
        }
      );

      /* 6️⃣ Quit state */
      const initial = await messaging().getInitialNotification();
      if (initial) {
        handleNavigation(initial.data);
      }
    }

    initFCM();

    return () => {
      unsubscribeOnMessage?.();
      unsubscribeOnOpen?.();
      unsubscribeOnTokenRefresh?.();
    };
  }, [isLoaded, isSignedIn]);

  function handleNavigation(data: any) {
    if (!data) return;

    if (data.tab) {
      router.replace(data.tab);
      return;
    }

    if (data.screen) {
      router.push({
        pathname: data.screen,
        params: data.params ? JSON.parse(data.params) : {},
      });
    }
  }

  return null;
}
