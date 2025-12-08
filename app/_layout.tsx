// app/_layout.tsx
import { Slot, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import CustomStatusBar from "@/components/CustomStatusBar";
import InitalLayout from "@/components/initalLayout";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import { useMutation } from "convex/react";
import React, { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { ToastProvider } from "@/components/Toast/ToastProvider";
function PresenceUpdater() {
  const updatePresence = useMutation(api.chat.updatePresence);

  useEffect(() => {
    // Fire immediately so other users see us online fast
    updatePresence().catch(() => {});

    // Periodic heartbeat
    const interval = setInterval(() => {
      updatePresence().catch(() => {});
    }, 8000); // ~8s is fine (server considers online if lastSeen < 15s)

    // Also update when app comes to foreground
    const onAppStateChange = (next: AppStateStatus) => {
      if (next === "active") {
        updatePresence().catch(() => {});
      }
    };
    const sub = AppState.addEventListener("change", onAppStateChange);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [updatePresence]);

  return null;
}
export default function RootLayout() {
  const pathname = usePathname();
  const hiddenScreens = ["/index", "/profile", "/lost-found", "/other-profile"];

  const shouldHide =
    hiddenScreens.includes(pathname) || pathname.startsWith("/lost-found/");

  return (
    <ClerkAndConvexProvider>
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
    </ClerkAndConvexProvider>
  );
}
