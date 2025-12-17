// convex/chat.ts
import { v } from "convex/values";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

/*───────────────────────────────────────────
  START OR GET CONVERSATION
───────────────────────────────────────────*/
export const startConversation = mutation({
  args: {
    participants: v.array(v.id("users")),
    title: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isGroup: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const participants = Array.from(new Set([...args.participants, me._id]));

    // Reuse existing 1-to-1 chat
    if (!args.isGroup && participants.length === 2) {
      const all = await ctx.db.query("conversations").collect();
      const found = all.find((c) => {
        if (c.participants.length !== 2) return false;
        const a = c.participants.map(String).sort().join(",");
        const b = participants.map(String).sort().join(",");
        return a === b;
      });
      if (found) return found;
    }

    return await ctx.db.insert("conversations", {
      participants,
      title: args.title,
      imageUrl: args.imageUrl,
      isGroup: args.isGroup ?? participants.length > 2,
      createdBy: me._id,
      lastMessage: "",
      lastMessageAt: Date.now(),
    });
  },
});

/*───────────────────────────────────────────
  SEND MESSAGE + FCM
───────────────────────────────────────────*/
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");

    let imageUrl: string | undefined;
    if (args.storageId) {
      const url = await ctx.storage.getUrl(args.storageId);
      imageUrl = url ?? undefined;
    }

    const now = Date.now();

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: me._id,
      text: args.text,
      imageUrl,
      storageId: args.storageId,
      createdAt: now,
      readBy: [me._id],
    });

    const preview =
      args.text?.trim() || (imageUrl ? "📷 Photo" : "New message");

    await ctx.db.patch(args.conversationId, {
      lastMessage: preview,
      lastMessageAt: now,
    });

    // Notifications + FCM
    for (const userId of conv.participants) {
      if (String(userId) === String(me._id)) continue;

      await ctx.db.insert("notifications", {
        receiverId: userId,
        senderId: me._id,
        type: "message",
        conversationId: args.conversationId,
        createdAt: now,
        read: false,
      });

      const receiver = await ctx.db.get(userId);
      if (!receiver?.fcmToken) continue;

      await ctx.scheduler.runAfter(0, api.fcm.sendMessageNotification, {
        fcmToken: receiver.fcmToken,
        senderName: me.username || me.fullname || "New message",
        message: preview,
        conversationId: String(args.conversationId),
      });
    }
  },
});

/*───────────────────────────────────────────
  GET MY CONVERSATIONS
───────────────────────────────────────────*/
export const getMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);
    const all = await ctx.db.query("conversations").collect();

    const mine = all.filter((c) =>
      c.participants.map(String).includes(String(me._id))
    );

    const result = [];

    for (const c of mine) {
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversation_createdAt", (q) =>
          q.eq("conversationId", c._id)
        )
        .order("desc")
        .take(200);

      let unread = 0;
      for (const m of msgs) {
        const readBy = m.readBy ?? [];
        const isMine = String(m.senderId) === String(me._id);
        const isRead = readBy.map(String).includes(String(me._id));
        if (!isMine && !isRead) unread++;
      }

      result.push({ ...c, unreadCount: unread });
    }

    return result.sort(
      (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
    );
  },
});

/*───────────────────────────────────────────
  LIVE MESSAGES
───────────────────────────────────────────*/
export const getMessagesLive = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation_createdAt", (q) =>
        q.eq("conversationId", conversationId)
      )
      .order("desc")
      .take(50);
  },
});

/*───────────────────────────────────────────
  MARK MESSAGES READ
───────────────────────────────────────────*/
export const markMessagesRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getAuthenticatedUser(ctx);

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_createdAt", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    for (const m of msgs) {
      const readBy = m.readBy ?? [];
      if (!readBy.map(String).includes(String(me._id))) {
        await ctx.db.patch(m._id, { readBy: [...readBy, me._id] });
      }
    }
  },
});

/*───────────────────────────────────────────
  TYPING INDICATOR (NO DUPLICATES)
───────────────────────────────────────────*/
export const startTyping = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getAuthenticatedUser(ctx);
    const now = Date.now();

    const old = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    for (const t of old) {
      if (String(t.userId) === String(me._id)) {
        await ctx.db.delete(t._id);
      }
    }

    await ctx.db.insert("typing", {
      conversationId,
      userId: me._id,
      createdAt: now,
      expiresAt: now + 5000,
    });
  },
});

export const getTypingForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const now = Date.now();
    const all = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    return all.filter((t) => t.expiresAt > now);
  },
});

/*───────────────────────────────────────────
  USER PRESENCE
───────────────────────────────────────────*/
export const updatePresence = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: now });
    } else {
      await ctx.db.insert("presence", {
        userId: me._id,
        lastSeen: now,
      });
    }
  },
});

export const getUserPresence = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const entry = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!entry) return { online: false, lastSeen: 0 };

    return {
      online: Date.now() - entry.lastSeen < 15000,
      lastSeen: entry.lastSeen,
    };
  },
});

export const stopTyping = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getAuthenticatedUser(ctx);

    const entries = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    for (const e of entries) {
      if (String(e.userId) === String(me._id)) {
        await ctx.db.delete(e._id);
      }
    }
  },
});
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const me = await getAuthenticatedUser(ctx);
    const msg = await ctx.db.get(messageId);
    if (!msg) throw new Error("Message not found");

    if (String(msg.senderId) !== String(me._id))
      throw new Error("Not your message");

    await ctx.db.delete(messageId);
  },
});

export const editMessage = mutation({
  args: { messageId: v.id("messages"), text: v.string() },
  handler: async (ctx, { messageId, text }) => {
    const me = await getAuthenticatedUser(ctx);
    const msg = await ctx.db.get(messageId);
    if (!msg) throw new Error("Message not found");

    if (String(msg.senderId) !== String(me._id))
      throw new Error("Not your message");

    await ctx.db.patch(messageId, { text });
  },
});

export const getOrStartConversation = mutation({
  args: {
    otherUserId: v.id("users"),
  },
  handler: async (ctx, { otherUserId }) => {
    const me = await getAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("isGroup"), false))
      .collect()
      .then((all) =>
        all.find((c) => {
          if (c.participants.length !== 2) return false;
          const setA = new Set(c.participants.map(String));
          const setB = new Set([String(me._id), String(otherUserId)]);
          return [...setA].every((v) => setB.has(v));
        })
      );

    if (existing) return existing;

    const now = Date.now();

    const id = await ctx.db.insert("conversations", {
      participants: [me._id, otherUserId],
      isGroup: false,
      createdBy: me._id,
      lastMessageAt: now,
      lastMessage: "",
    });

    return await ctx.db.get(id);
  },
});
export const getUnreadMessageCount = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    // fetch conversations where I'm a participant
    const conversations = await ctx.db.query("conversations").collect();

    const myConversations = conversations.filter((c) =>
      c.participants.map(String).includes(String(me._id))
    );

    let unreadTotal = 0;

    for (const conv of myConversations) {
      // fetch only last 200 messages for performance
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversation_createdAt", (q) =>
          q.eq("conversationId", conv._id)
        )
        .order("desc")
        .take(200);

      for (const m of msgs) {
        const readBy = m.readBy ?? [];
        const alreadyRead = readBy.map(String).includes(String(me._id));
        const isMine = String(m.senderId) === String(me._id);

        if (!isMine && !alreadyRead) unreadTotal++;
      }
    }

    return unreadTotal;
  },
});
