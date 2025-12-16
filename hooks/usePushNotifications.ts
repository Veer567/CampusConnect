import { registerForPushNotificationsAsync } from "@/app/notificationsConfig";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-expo";

type NotifSub = Notifications.Subscription | null;

export default function usePushNotifications() {
  const { isSignedIn } = useAuth(); // ✅ IMPORTANT
  const saveToken = useMutation(api.users.savePushToken);

  const notificationListener = useRef<NotifSub>(null);
  const responseListener = useRef<NotifSub>(null);

  useEffect(() => {
    if (!isSignedIn) return; // 🔴 PREVENT UNAUTHORIZED

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

          if (data?.tab) router.replace(data.tab);
          if (data?.screen) {
            router.push({
              pathname: data.screen,
              params: data.params ?? {},
            });
          }
        });
    }

    setup();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isSignedIn]); // ✅ dependency

  return null;
}
