// ClerkAndConvexProvider.tsx  
// This component wraps the entire app with both Clerk (for authentication)  
// and Convex (for backend database + real-time sync) providers.  
// It ensures secure integration between Clerk’s user session and Convex’s API access.

import React, { useEffect } from "react";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// ✅ Environment variables for secure runtime configuration
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// Validate environment setup to prevent runtime issues
if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}
if (!convexUrl) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_URL");
}

// ✅ Initialize Convex client (manages DB queries, mutations, etc.)
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false, // disables “unsaved changes” browser prompt
});

export default function ClerkAndConvexProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Wrap app with Clerk provider for authentication
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {/* Connect Convex client with Clerk’s authentication state */}
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        {/* Ensures child components render only after Clerk is fully initialized */}
        <ClerkLoaded>{children}</ClerkLoaded>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
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
