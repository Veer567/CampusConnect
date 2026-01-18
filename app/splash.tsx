


import { View, Text, Image, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import * as SplashScreen from "expo-splash-screen";

export default function AppSplash() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;

    let timeoutId: NodeJS.Timeout;
    let maxWaitTimeoutId: NodeJS.Timeout;

    // Fallback timeout - navigate after 5 seconds even if Clerk hasn't loaded
    maxWaitTimeoutId = setTimeout(() => {
      if (!hasNavigated.current && !isLoaded) {
        hasNavigated.current = true;
        SplashScreen.hideAsync().then(() => {
          router.replace("/(auth)/login");
        });
      }
    }, 5000);

    // Main navigation logic - wait for Clerk to load
    if (isLoaded) {
      timeoutId = setTimeout(async () => {
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          clearTimeout(maxWaitTimeoutId);
          await SplashScreen.hideAsync();
          router.replace(isSignedIn ? "/(tabs)" : "/(auth)/login");
        }
      }, 1800);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (maxWaitTimeoutId) clearTimeout(maxWaitTimeoutId);
    };
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/splash/image2.png")}
        style={styles.appImage}
        resizeMode="contain"
      />

      <Text style={styles.appName}>CampusConnect</Text>

      <View style={styles.footer}>
        <Text style={styles.poweredText}>Powered by Marwadi University</Text>
        <Image
          source={require("@/assets/splash/mu_logo.png")}
          style={styles.muLogo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  appImage: {
    width: 260,
    height: 260,
  },
  appName: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: "700",
    color: "#0EA5E9",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
  },
  poweredText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  muLogo: {
    width: 140,
    height: 50,
  },
});
