// app/_layout.tsx
import { Slot, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import CustomStatusBar from "@/components/CustomStatusBar";
import InitalLayout from "@/components/initalLayout";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import { useMutation } from "convex/react";
import React, { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { ToastProvider } from "@/components/Toast/ToastProvider";
import { useAuth } from "@clerk/clerk-expo";

import { NotificationProvider } from "@/components/NotificationManager"; // <-- ADD THIS

function PresenceUpdater() {
  const updatePresence = useMutation(api.chat.updatePresence);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    updatePresence().catch(() => {});

    const interval = setInterval(() => {
      updatePresence().catch(() => {});
    }, 8000);

    const onAppStateChange = (next: AppStateStatus) => {
      if (next === "active") updatePresence().catch(() => {});
    };

    const sub = AppState.addEventListener("change", onAppStateChange);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [isSignedIn, updatePresence]);

  return null;
}

export default function RootLayout() {
  const pathname = usePathname();
  const hiddenScreens = ["/index", "/profile", "/other-profile"];

  const shouldHide =
    hiddenScreens.includes(pathname) || pathname.startsWith("/hello");

  return (
    <ClerkAndConvexProvider>
      <NotificationProvider> {/* <-- WRAP ENTIRE APP */}

        <PresenceUpdater />

        <SafeAreaProvider>
          {!shouldHide && (
            <CustomStatusBar
              colors={[COLORS.primary, COLORS.secondary]}
              style="light"
            />
          )}

          <GestureHandlerRootView style={{ flex: 1 }}>
            <ToastProvider>
              <InitalLayout>
                <Slot />
              </InitalLayout>
            </ToastProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>

      </NotificationProvider>
    </ClerkAndConvexProvider>
  );
}
