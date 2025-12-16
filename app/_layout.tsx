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

/*──────────────────────────────────────────────
  🔔 Android Notification Channels (EARLY)
──────────────────────────────────────────────*/
if (Platform.OS === "android") {
  // Messages (high priority, chat-style)
  Notifications.setNotificationChannelAsync("messages", {
    name: "Messages",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
  });

  // Default fallback channel
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
                {/* Controls status bar based on route */}
                <StatusBarController />

                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                    animationDuration: 180,
                  }}
                >
                  {/* Main tabs */}
                  <Stack.Screen name="(tabs)" />

                  {/* Profile related */}
                  <Stack.Screen name="followers" />
                  <Stack.Screen name="following" />
                  <Stack.Screen name="user-posts" />
                  <Stack.Screen name="other-profile" />

                  {/* Content */}
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
