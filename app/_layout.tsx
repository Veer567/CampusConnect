import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import InitalLayout from "@/components/initalLayout";
import { NotificationProvider } from "@/components/NotificationManager";
import StatusBarController from "@/components/StatusBarController";
import { ToastProvider } from "@/components/Toast/ToastProvider";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";

import { ensureFirebaseReady } from "./firebaseConfig";
import useFCMNotifications from "@/hooks/useFCMNotifications";

/* 🔥 Firebase native modules are linked at build time */
ensureFirebaseReady();

/*──────────────────────────────────────────────
  Helper component (INSIDE providers)
──────────────────────────────────────────────*/
function AppWithNotifications() {
  useFCMNotifications(); // ✅ SAFE here
  return null;
}

/*──────────────────────────────────────────────
  Root Layout
──────────────────────────────────────────────*/
export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      <AppWithNotifications />

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
