import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const saveFcmToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Avoid unnecessary writes
    if (user.fcmToken === token) {
      return "unchanged";
    }

    await ctx.db.patch(user._id, {
      fcmToken: token,
      fcmTokenUpdatedAt: Date.now(),
    });

    return "saved";
  },
});
