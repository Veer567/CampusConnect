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
      const token = await registerForPushNotificationsAsync();

      if (token) {
        await saveToken({ token });
        console.log("Push token saved:", token);
      }

      // Foreground notifications
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notif) => {
          console.log("Foreground notification:", notif);
        });

      // When user taps notification
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
