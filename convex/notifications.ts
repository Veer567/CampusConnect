import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

/*───────────────────────────────────────────
  HELPERS
───────────────────────────────────────────*/
function dayLabel(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();

  const isSameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isSameDay) return "Today";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return "Older";
}

/*───────────────────────────────────────────
  GET UNREAD COUNT
───────────────────────────────────────────*/
export const getUnreadCount = query({
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", me._id))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    return notifs.length;
  },
});

/*───────────────────────────────────────────
  FETCH NOTIFICATIONS (BATCHED BY DAY)
───────────────────────────────────────────*/
export const getNotifications = query({
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    // 🔥 LIMIT results
    const raw = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", me._id))
      .order("desc")
      .take(50);

    // ─────────────────────────────
    // Fetch senders in ONE pass
    // ─────────────────────────────
    const senderIds = Array.from(
      new Set(raw.map((n) => n.senderId).filter(Boolean))
    );

    const senders = await Promise.all(
      senderIds.map((id) => ctx.db.get(id!))
    );

    const senderMap = new Map(
      senders
        .filter(Boolean)
        .map((s) => [
          String(s!._id),
          { _id: s!._id, username: s!.username, image: s!.image },
        ])
    );

    // ─────────────────────────────
    // GROUP + BATCH LOGIC
    // ─────────────────────────────
    const dayMap = new Map<string, any[]>();
    const groupMap = new Map<string, any>();

    for (const n of raw) {
      const day = dayLabel(n.createdAt);

      const groupKey = [
        day,
        n.senderId,
        n.type,
        n.postId ?? "none",
      ].join("|");

      if (!groupMap.has(groupKey)) {
        const grouped = {
          ...n,
          count: 1,
          sender: n.senderId
            ? senderMap.get(String(n.senderId)) ?? null
            : null,
        };

        groupMap.set(groupKey, grouped);

        if (!dayMap.has(day)) dayMap.set(day, []);
        dayMap.get(day)!.push(grouped);
      } else {
        const existing = groupMap.get(groupKey);
        existing.count += 1;

        // Keep latest timestamp
        if (n.createdAt > existing.createdAt) {
          existing.createdAt = n.createdAt;
        }

        // unread stays unread if ANY is unread
        existing.read = existing.read && n.read;
      }
    }

    // ─────────────────────────────
    // FINAL ORDERED RESULT
    // ─────────────────────────────
    const order = ["Today", "Yesterday", "Older"];

    return order
      .filter((label) => dayMap.has(label))
      .map((label) => ({
        label,
        items: dayMap.get(label)!,
      }));
  },
});

/*───────────────────────────────────────────
  MARK SINGLE AS READ
───────────────────────────────────────────*/
export const markNotificationRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const me = await getAuthenticatedUser(ctx);

    const n = await ctx.db.get(id);
    if (!n) throw new Error("Notification not found");
    if (String(n.receiverId) !== String(me._id))
      throw new Error("Not authorized");

    await ctx.db.patch(id, { read: true });
    return { ok: true };
  },
});

/*───────────────────────────────────────────
  MARK ALL AS READ
───────────────────────────────────────────*/
export const markAllNotificationsRead = mutation({
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", me._id))
      .collect();

    await Promise.all(
      notifs.map((n) => ctx.db.patch(n._id, { read: true }))
    );

    return { ok: true };
  },
});

/*───────────────────────────────────────────
  DELETE SINGLE
───────────────────────────────────────────*/
export const deleteNotification = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const me = await getAuthenticatedUser(ctx);

    const n = await ctx.db.get(id);
    if (!n) throw new Error("Notification not found");
    if (String(n.receiverId) !== String(me._id))
      throw new Error("Not authorized");

    await ctx.db.delete(id);
    return { ok: true };
  },
});

/*───────────────────────────────────────────
  CLEAR ALL
───────────────────────────────────────────*/
export const clearAllNotifications = mutation({
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", me._id))
      .collect();

    for (const n of notifs) {
      await ctx.db.delete(n._id);
    }

    return { ok: true };
  },
});
