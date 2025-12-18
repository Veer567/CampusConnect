// app/_layout.tsx
import "@/firebaseBackground"

import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";

import InitalLayout from "@/components/initalLayout";
import { NotificationProvider } from "@/components/NotificationManager";
import StatusBarController from "@/components/StatusBarController";
import { ToastProvider } from "@/components/Toast/ToastProvider";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";

import { ensureFirebaseReady } from "./firebaseConfig";
import useFCMNotifications from "@/hooks/useFCMNotifications";

import messaging from "@react-native-firebase/messaging";

/* 🔥 Ensure Firebase native modules are linked */
ensureFirebaseReady();

/*──────────────────────────────────────────────
  Notification Deep Link Handler
──────────────────────────────────────────────*/
function NotificationNavigationHandler() {
  const router = useRouter();

  useEffect(() => {
    // 🔹 App opened from killed state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        const screen = remoteMessage?.data?.screen;
        if (screen) {
          router.replace(screen as any);
        }
      });

    // 🔹 App opened from background
    const unsubscribe = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        const screen = remoteMessage?.data?.screen;
        if (screen) {
          router.push(screen as any);
        }
      }
    );

    return unsubscribe;
  }, []);

  return null;
}

/*──────────────────────────────────────────────
  FCM Registration (token, permissions, listeners)
──────────────────────────────────────────────*/
function AppWithNotifications() {
  useFCMNotifications(); // registers token + foreground handling
  return null;
}

/*──────────────────────────────────────────────
  Root Layout
──────────────────────────────────────────────*/
export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      {/* 🔔 FCM + Deep Linking */}
      <AppWithNotifications />
      <NotificationNavigationHandler />

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
                  {/* Tabs */}
                  <Stack.Screen name="(tabs)" />

                  {/* Other Screens */}
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
