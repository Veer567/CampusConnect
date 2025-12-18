import { useAuth } from "@clerk/clerk-expo";
import messaging from "@react-native-firebase/messaging";
import { useMutation } from "convex/react";
import { router } from "expo-router";
import { useEffect } from "react";

import { api } from "@/convex/_generated/api";

export default function useFCMNotifications() {
  const { isLoaded, isSignedIn } = useAuth();
  const saveFcmToken = useMutation(api.pushTokens.saveFcmToken);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let unsubMessage: () => void;
    let unsubOpen: () => void;
    let unsubRefresh: () => void;

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

      /* 2️⃣ Initial token */
      const token = await messaging().getToken();
      if (token) {
        await saveFcmToken({ token });
      }

      /* 3️⃣ Token refresh */
      unsubRefresh = messaging().onTokenRefresh(async (newToken) => {
        await saveFcmToken({ token: newToken });
      });

      /* 4️⃣ Foreground messages */
      unsubMessage = messaging().onMessage(async (remoteMessage) => {
        console.log("📩 Foreground FCM:", remoteMessage);
      });

      /* 5️⃣ Background → open */
      unsubOpen = messaging().onNotificationOpenedApp((remoteMessage) => {
        handleNavigation(remoteMessage.data);
      });

      /* 6️⃣ Quit → open */
      const initial = await messaging().getInitialNotification();
      if (initial) {
        handleNavigation(initial.data);
      }
    }

    initFCM();

    return () => {
      unsubMessage?.();
      unsubOpen?.();
      unsubRefresh?.();
    };
  }, [isLoaded, isSignedIn]);

  function handleNavigation(data: any) {
    if (!data) return;

    if (data.tab) {
      router.replace(data.tab);
      return;
    }

    if (data.screen) {
      router.push(data.screen);
    }
  }

  return null;
}
