import { mutation } from "./_generated/server";
import { getAuthenticatedUser } from "./users";
import { v } from "convex/values";

/*─────────────────────────────────────────────
  SEND SUPPORT MESSAGE
──────────────────────────────────────────────*/
export const sendSupportMessage = mutation({
  args: {
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    await ctx.db.insert("supportMessages", {
      userId: user._id,
      email: args.email,
      message: args.message,
      createdAt: Date.now(),
    });

    return true;
  },
});

/*─────────────────────────────────────────────
  REPORT ISSUE
──────────────────────────────────────────────*/
export const reportIssue = mutation({
  args: {
    issue: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    await ctx.db.insert("reportedIssues", {
      userId: user._id,
      issue: args.issue,
      createdAt: Date.now(),
    });

    return true;
  },
});

/*─────────────────────────────────────────────
  DELETE ACCOUNT (FULL DELETE)
──────────────────────────────────────────────*/
export const deleteAccount = mutation({
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const uid = user._id;

    // Delete user's posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();

    for (const p of posts) await ctx.db.delete(p._id);

    // Delete marketplace posts
    const mPosts = await ctx.db
      .query("marketplacePosts")
      .withIndex("by_creator", (q) => q.eq("creatorId", uid))
      .collect();

    for (const p of mPosts) await ctx.db.delete(p._id);

    // Delete chats
    const convos = await ctx.db
      .query("conversations")
      .collect();

    for (const c of convos) {
      if (c.participants.includes(uid)) await ctx.db.delete(c._id);
    }

    // Delete notifications
    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", uid))
      .collect();

    for (const n of notifs) await ctx.db.delete(n._id);

    // Delete support messages
    const support = await ctx.db
      .query("supportMessages")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();

    for (const s of support) await ctx.db.delete(s._id);

    // Delete issues
    const issues = await ctx.db
      .query("reportedIssues")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();

    for (const i of issues) await ctx.db.delete(i._id);

    // Finally delete user profile
    await ctx.db.delete(uid);

    return true;
  },
});
