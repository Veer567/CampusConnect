// hooks/useProfileImageCache.ts
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

let GLOBAL_IMAGE_BUSTER = Date.now();

export const triggerProfileImageUpdate = () => {
  GLOBAL_IMAGE_BUSTER = Date.now();
};

export function useProfileImageCache(userId?: string) {
  const [buster, setBuster] = useState(GLOBAL_IMAGE_BUSTER);
  const profile = useQuery(
    userId ? api.users.getUserProfile : api.users.getUserByClerkId,
    userId ? { id: userId as any } : "skip"
  );

  useEffect(() => {
    if (profile?.image) setBuster(GLOBAL_IMAGE_BUSTER);
  }, [profile?.image]);

  return buster;
}