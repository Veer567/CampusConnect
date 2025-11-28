import { Slot, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import CustomStatusBar from "@/components/CustomStatusBar";
import InitalLayout from "@/components/initalLayout";
import { COLORS } from "@/constants/themes";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect } from "react";

// 🔥 Presence updater component (safe inside provider)
function PresenceUpdater() {
  const updatePresence = useMutation(api.chat.updatePresence);

  useEffect(() => {
    const interval = setInterval(() => {
      updatePresence().catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return null;
}

export default function RootLayout() {
  const pathname = usePathname();

  const hiddenScreens = ["/index", "/profile", "/lost-found"];
  const shouldHide =
    hiddenScreens.includes(pathname) || pathname.startsWith("/lost-found/");

  return (
    <ClerkAndConvexProvider>
      <PresenceUpdater /> {/* <-- Now Convex works! */}

      <SafeAreaProvider>
        {!shouldHide && (
          <CustomStatusBar
            colors={[COLORS.primary, COLORS.secondary]}
            style="light"
          />
        )}

        <GestureHandlerRootView style={{ flex: 1 }}>
          <InitalLayout>
            <Slot />
          </InitalLayout>
        </GestureHandlerRootView>

        <Toast />
      </SafeAreaProvider>
    </ClerkAndConvexProvider>
  );
}
