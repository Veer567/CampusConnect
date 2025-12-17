// app/firebaseConfig.ts

import messaging from "@react-native-firebase/messaging";

/**
 * Ensures Firebase native modules are loaded.
 * React Native Firebase auto-initializes using native config files.
 */
export function ensureFirebaseReady() {
  void messaging();
  console.log("🔥 Firebase native modules ready");
}
