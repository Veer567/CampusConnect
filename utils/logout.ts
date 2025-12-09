import { useConvexAuth } from "convex/react";
import { useAuth } from "@clerk/clerk-expo";

export async function appLogout(signOut: any, convexClear: any) {
  try {
    convexClear();   // removes all live queries & subscriptions
    await signOut(); // logs out Clerk user
  } catch (e) {
    console.log("Logout error", e);
  }
}
