import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const savePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { pushToken: token });
  }
});
