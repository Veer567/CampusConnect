import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "@/app/notificationsConfig";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { router } from "expo-router";

type NotifSub = Notifications.Subscription | null;

export default function usePushNotifications() {
  const saveToken = useMutation(api.users.savePushToken);

  const notificationListener = useRef<NotifSub>(null);
  const responseListener = useRef<NotifSub>(null);

  useEffect(() => {
    async function setup() {
      const token = await registerForPushNotificationsAsync();
      console.log("Expo Push Token:", token);

      if (token) await saveToken({ token });

      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Foreground notification:", notification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const action = response.actionIdentifier;
          const data: any = response.notification.request.content.data;

          console.log("Tapped:", action, data);

          if (action === "REPLY") {
            console.log("User replied:", response.userText);
            return;
          }

          if (action === "MARK_AS_READ") {
            console.log("Mark as read triggered");
            return;
          }

          if (data?.tab) router.replace(data.tab as any);

          if (data?.screen) {
            router.push({
              pathname: data.screen as any,
              params: (data.params || {}) as any
            });
          }
        });
    }

    setup();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return null;
}
