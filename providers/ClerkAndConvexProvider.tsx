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
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ClerkLoaded>
          <PresenceUpdater />
          {children}
        </ClerkLoaded>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

/* ---------------- Presence Updater ---------------- */
function PresenceUpdater() {
  const updatePresence = useMutation(api.chat.updatePresence);

  useEffect(() => {
    const id = setInterval(() => {
      updatePresence().catch(() => {});
    }, 5000);

    return () => clearInterval(id);
  }, []);

  return null;
}
