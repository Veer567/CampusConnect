// convex/pushTokens.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const savePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) throw new Error("User not found");

    // Save or update push token
    await ctx.db.patch(me._id, { pushToken: token });

    return { ok: true };
  },
});
