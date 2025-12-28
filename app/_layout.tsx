// app/_layout.tsx

import "@/firebaseBackground";

import { Stack, useRootNavigationState, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

import * as Notifications from "expo-notifications";

import InitalLayout from "@/components/initalLayout";
import { NotificationProvider } from "@/components/NotificationManager";
import StatusBarController from "@/components/StatusBarController";
import { ToastProvider } from "@/components/Toast/ToastProvider";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import useFCMNotifications from "@/hooks/useFCMNotifications";
import { ensureFirebaseReady } from "./firebaseConfig";

/* ✅ ADD THESE IMPORTS */
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";

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
      }
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
  /* 🔑 LOAD FONTS */
  const [fontsLoaded] = useFonts({
    ...Ionicons.font, // ✅ REQUIRED FOR ICONS
    // If you use custom fonts, load them here:
    // Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
  });

  /* ⛔ BLOCK RENDER UNTIL FONTS READY */
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ClerkAndConvexProvider>
      <AppWithNotifications />
      <NotificationDeepLinkHandler />

      <NotificationProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ToastProvider>
              <InitalLayout>
                <StatusBarController />

                <Stack
                  initialRouteName="(tabs)"
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
