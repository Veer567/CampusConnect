import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";

export default function PresenceUpdater() {
  const updatePresence = useMutation(api.chat.updatePresence);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    updatePresence().catch(() => {});
    const interval = setInterval(() => {
      updatePresence().catch(() => {});
    }, 8000);

    const onAppStateChange = (next: AppStateStatus) => {
      if (next === "active") updatePresence().catch(() => {});
    };

    const sub = AppState.addEventListener("change", onAppStateChange);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [isSignedIn, updatePresence]);

  return null;
}
