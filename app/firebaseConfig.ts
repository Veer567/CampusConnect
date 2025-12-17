// app/firebaseConfig.ts

/**
 * Ensures Firebase native modules are loaded.
 * React Native Firebase auto-initializes using native config files.
 */
// app/firebaseConfig.ts
export function ensureFirebaseReady() {
  // no-op, required only to ensure native modules are linked in dev client / APK
  return true;
}
