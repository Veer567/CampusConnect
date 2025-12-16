import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import { ToastProvider } from "@/components/Toast/ToastProvider";
import { NotificationProvider } from "@/components/NotificationManager";
import InitalLayout from "@/components/initalLayout";
import StatusBarController from "@/components/StatusBarController";

export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      <NotificationProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ToastProvider>
              <InitalLayout>
                {/* ✅ Pathname logic moved INSIDE */}
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
