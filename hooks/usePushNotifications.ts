// hooks/usePushNotifications.ts
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "@/app/notificationsConfig";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

export default function usePushNotifications() {
  const saveToken = useMutation(api.users.savePushToken);

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    async function setup() {
      // 🔥 STEP 1: Request permissions and generate push token
      const token = await registerForPushNotificationsAsync();

      // 🟢 DEBUG: Log the token so you know if your phone supports push
      console.log("Generated Expo Push Token:", token);

      // 🔥 STEP 2: Save token to backend (Convex)
      if (token) {
        await saveToken({ token });
        console.log("Push token saved to Convex:", token);
      } else {
        console.warn("⚠️ No push token generated — this device/app cannot receive notifications.");
      }

      // 🔥 STEP 3: Listen for foreground notifications
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notif) => {
          console.log("Foreground notification:", notif);
        });

      // 🔥 STEP 4: Handle notification taps
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("Notification tapped:", response);
        });
    }

    setup();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
