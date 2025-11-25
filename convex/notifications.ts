// convex/notifications.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

/*───────────────────────────────────────────
  GET UNREAD NOTIFICATION COUNT
───────────────────────────────────────────*/
export const getUnreadCount = query({
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", me._id))
      .collect();

    return notifs.filter((n) => !n.read).length;
  },
});

/*───────────────────────────────────────────
  FETCH ALL NOTIFICATIONS (LATEST FIRST)
───────────────────────────────────────────*/
export const getNotifications = query({
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", me._id))
      .order("desc")
      .collect();

    const withSender = await Promise.all(
      notifs.map(async (n) => {
        const sender = n.senderId ? await ctx.db.get(n.senderId) : null;
        return {
          ...n,
          sender: sender
            ? { _id: sender._id, username: sender.username, image: sender.image }
            : null,
        };
      })
    );

    return withSender;
  },
});

/*───────────────────────────────────────────
  MARK A SINGLE NOTIFICATION AS READ
  (authorization check added)
───────────────────────────────────────────*/
export const markNotificationRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const me = await getAuthenticatedUser(ctx);

    const n = await ctx.db.get(id);
    if (!n) throw new Error("Notification not found");
    if (String(n.receiverId) !== String(me._id)) throw new Error("Not authorized");

    await ctx.db.patch(id, { read: true });
    return { ok: true };
  },
});

/*───────────────────────────────────────────
  MARK ALL NOTIFICATIONS AS READ (only user's)
───────────────────────────────────────────*/
export const markAllNotificationsRead = mutation({
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", me._id))
      .collect();

    await Promise.all(notifs.map((n) => ctx.db.patch(n._id, { read: true })));

    return { ok: true };
  },
});

/*───────────────────────────────────────────
  DELETE NOTIFICATION (only receiver can delete)
───────────────────────────────────────────*/
export const deleteNotification = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const me = await getAuthenticatedUser(ctx);

    const n = await ctx.db.get(id);
    if (!n) throw new Error("Notification not found");
    if (String(n.receiverId) !== String(me._id)) throw new Error("Not authorized");

    await ctx.db.delete(id);
    return { ok: true };
  },
});
