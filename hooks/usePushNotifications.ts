import { registerForPushNotificationsAsync } from "@/app/notificationsConfig";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

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

          console.log("Notification tapped:", action, data);

          // ⭐ ADVANCED: Inline Reply Handling (MessagingStyle)
          if (action === "REPLY") {
            const replyText = response.userText;
            console.log("User replied:", replyText);

            // TODO: send reply to Convex chat service
            // await sendMessageMutation({ chatId: data.params.id, text: replyText })

            return;
          }

          // ⭐ Mark as Read action
          if (action === "MARK_AS_READ") {
            console.log("Mark as Read triggered");

            // TODO: trigger a Convex mutation to mark chat messages read
            return;
          }

          // ⭐ Deep linking to a tab
          if (data?.tab) {
            router.replace(data.tab as any);
          }

          // ⭐ Deep linking to screen
          if (data?.screen) {
            router.push({
              pathname: data.screen as any,
              params: (data.params || {}) as any,
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
