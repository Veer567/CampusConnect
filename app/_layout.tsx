import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot, usePathname } from "expo-router";
import Toast from "react-native-toast-message";

import { COLORS } from "@/constants/themes";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import InitalLayout from "@/components/initalLayout";
import CustomStatusBar from "@/components/CustomStatusBar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const pathname = usePathname();

  // Screens where you don't want the gradient status bar
  const excludedScreens = ["/index", "/profile" , "/other-profile" , "/lost-found"];

  const shouldHideStatusBar = excludedScreens.some((path) =>
    pathname.endsWith(path)  
  );

  return (
    
    <ClerkAndConvexProvider>
      
      <SafeAreaProvider>
      
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
