// hooks/useBackToSettingsRoot.ts
import { useEffect } from "react";
import { BackHandler } from "react-native";
import { useRouter } from "expo-router";

/**
 * When called from a settings subpage, this makes the Android hardware
 * back button navigate to the settings drawer root (/(settings)).
 *
 * Usage: call useBackToSettingsRoot() inside Account, FAQ, Privacy, Report screens.
 */
export default function useBackToSettingsRoot() {
  const router = useRouter();

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      // Replace so the settings subpage doesn't remain in history
      router.replace("/SettingsDrawer");
      return true; // handled
    });

    return () => sub.remove();
  }, [router]);
}
