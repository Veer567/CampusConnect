// app/_layout.tsx

import "@/firebaseBackground";

import { Stack, useRootNavigationState, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import * as Notifications from "expo-notifications";

import { NotificationProvider } from "@/components/NotificationManager";
import StatusBarController from "@/components/StatusBarController";
import { ToastProvider } from "@/components/Toast/ToastProvider";
import useFCMNotifications from "@/hooks/useFCMNotifications";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import { ensureFirebaseReady } from "./firebaseConfig";

/* ✅ ADD THESE IMPORTS */
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
SplashScreen.preventAutoHideAsync(); // ✅ MOVED HERE

/* 🔥 Ensure Firebase native modules are ready */
ensureFirebaseReady();

/*──────────────────────────────────────────────
  Route Type Guard
──────────────────────────────────────────────*/
function isValidRoute(value: unknown): boolean {
  return typeof value === "string" && value.startsWith("/");
}

/*──────────────────────────────────────────────
  Notification Deep Link Handler
──────────────────────────────────────────────*/
function NotificationDeepLinkHandler() {
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      const screen = response?.notification?.request?.content?.data?.screen;
      if (isValidRoute(screen)) {
        router.replace(screen as any);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const screen = response.notification.request.content.data?.screen;
        if (isValidRoute(screen)) {
          router.push(screen as any);
        }
      },
    );

    return () => subscription.remove();
  }, [navState?.key]);

  return null;
}

/*──────────────────────────────────────────────
  FCM Registration
──────────────────────────────────────────────*/
function AppWithNotifications() {
  useFCMNotifications();
  return null;
}

/*──────────────────────────────────────────────
  🌱 Root Layout (FIXED)
──────────────────────────────────────────────*/

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  // 🔥 HIDE NATIVE SPLASH ASAP
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!fontsLoaded) {
    // ❗ DO NOT BLOCK RENDER
    return <View style={{ flex: 1, backgroundColor: "#fff" }} />;
  }

  return (
    <ClerkAndConvexProvider>
      <NotificationProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ToastProvider>
              <StatusBarController />

              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="followers" />
                <Stack.Screen name="following" />
                <Stack.Screen name="user-posts" />
                <Stack.Screen name="other-profile" />
                <Stack.Screen name="post-details" />
                <Stack.Screen name="chat-screen" />
              </Stack>
            </ToastProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </NotificationProvider>
    </ClerkAndConvexProvider>
  );
}

