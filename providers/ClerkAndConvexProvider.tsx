// providers/ClerkAndConvexProvider.tsx

import React, { useEffect } from "react";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function ClerkAndConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider 
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!} 
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <PresenceUpdater />
          {children}
        </ConvexProviderWithClerk>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

/* ---------------- Presence Updater ---------------- */
function PresenceUpdater() {
  const updatePresence = useMutation(api.chat.updatePresence);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return; // ← only run if authenticated

    updatePresence().catch(() => {});

    const interval = setInterval(() => {
      updatePresence().catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [isSignedIn]);

  return null;
}
