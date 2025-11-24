import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const getNotifcations = query({
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", user._id))
      .order("desc")
      .collect();

    // hydrate sender + post info
    return await Promise.all(
      notifs.map(async (n) => {
        const sender = await ctx.db.get(n.senderId);
        const post = n.postId ? await ctx.db.get(n.postId) : null;
        return {
          ...n,
          sender,
          post,
        };
      })
    );
  },
});

export const markAllNotificationsRead = mutation({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const all = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", currentUser._id))
      .order("desc")
      .collect();

    await Promise.all(all.map((n) => ctx.db.patch(n._id, { read: true })));

    return { ok: true };
  },
});

export const markNotificationRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const n = await ctx.db.get(id);

    if (!n) throw new Error("Notification not found");
    if (n.receiverId !== currentUser._id) throw new Error("Not authorized");

    await ctx.db.patch(id, { read: true });
    return { ok: true };
  },
});

export const deleteNotification = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const n = await ctx.db.get(id);

    if (!n) throw new Error("Notification not found");
    if (n.receiverId !== currentUser._id) throw new Error("Not authorized");

    await ctx.db.delete(id);
    return { ok: true };
  },
});
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", me._id))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    return unread.length;
  },
});