import { Slot, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import CustomStatusBar from "@/components/CustomStatusBar";
import InitalLayout from "@/components/initalLayout";
import { COLORS } from "@/constants/themes";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";

export default function RootLayout() {
  const pathname = usePathname();

  // Screens where StatusBar should be hidden
  const exactHiddenScreens = [
    "/index",
    "/profile",
    "/other-profile",
    "/lost-found"
  ];

  const isExactMatch = exactHiddenScreens.includes(pathname);

  const isLostFoundChild =
    pathname.startsWith("/lost-found/"); 
    // matches /lost-found/add, /lost-found/edit, etc.

  const shouldHideStatusBar = isExactMatch || isLostFoundChild;

  return (
    <ClerkAndConvexProvider>
      <SafeAreaProvider>
        {/* Hide global status bar ONLY for selected screens */}
        {!shouldHideStatusBar && (
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
