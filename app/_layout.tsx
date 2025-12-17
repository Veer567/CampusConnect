import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import InitalLayout from "@/components/initalLayout";
import { NotificationProvider } from "@/components/NotificationManager";
import StatusBarController from "@/components/StatusBarController";
import { ToastProvider } from "@/components/Toast/ToastProvider";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";

import { ensureFirebaseReady } from "./firebaseConfig";

/* 🔥 Initialize Firebase ONCE at app start */
ensureFirebaseReady();

/*──────────────────────────────────────────────
  🔔 Android Notification Channels
──────────────────────────────────────────────*/
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("messages", {
    name: "Messages",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    lockscreenVisibility:
      Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
  });

  Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/*──────────────────────────────────────────────
  Root Layout
──────────────────────────────────────────────*/
export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      <NotificationProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ToastProvider>
              <InitalLayout>
                <StatusBarController />

                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                    animationDuration: 180,
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="followers" />
                  <Stack.Screen name="following" />
                  <Stack.Screen name="user-posts" />
                  <Stack.Screen name="other-profile" />
                  <Stack.Screen name="post-details" />
                  <Stack.Screen name="chat-screen" />
                </Stack>
              </InitalLayout>
            </ToastProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </NotificationProvider>
    </ClerkAndConvexProvider>
  );
}
