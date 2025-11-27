// chat.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

/*───────────────────────────────────────────
  START OR GET CONVERSATION (1-to-1 or group)
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

    // Ensure current user is included
    const participants = Array.from(new Set([...args.participants, me._id]));

    // Direct chat (1-to-1)
    const isDirect = !args.isGroup && participants.length === 2;

    if (isDirect) {
      // Check if conversation already exists
      const existing = await ctx.db
        .query("conversations")
        .collect()
        .then((all) =>
          all.find((c) => {
            if (!c.participants || c.participants.length !== 2) return false;
            const a = new Set(c.participants.map(String));
            const b = new Set(participants.map(String));
            if (a.size !== b.size) return false;
            for (const p of a) if (!b.has(p)) return false;
            return true;
          })
        );

      if (existing) return existing;
    }

    // Create new conversation
    return await ctx.db.insert("conversations", {
      participants,
      title: args.title,
      imageUrl: args.imageUrl,
      isGroup: args.isGroup ?? participants.length > 2,
      createdBy: me._id,
      lastMessageAt: Date.now(),
    });
  },
});

/*───────────────────────────────────────────
  SEND MESSAGE (text or image)
───────────────────────────────────────────*/
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    if (!conversation.participants.map(String).includes(String(me._id)))
      throw new Error("Not a participant");

    // If we have an image → get URL
    let imageUrl: string | undefined = undefined;
    if (args.storageId) {
      imageUrl = (await ctx.storage.getUrl(args.storageId)) ?? undefined;
    }

    const now = Date.now();

    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: me._id,
      text: args.text,
      imageUrl,
      storageId: args.storageId,
      createdAt: now,
      readBy: [me._id],
    });

    await ctx.db.patch(args.conversationId, {
      lastMessage: args.text ?? (imageUrl ? "📷 Photo" : "Attachment"),
      lastMessageAt: now,
    });

    // Create notifications for others
    for (const userId of conversation.participants) {
      if (String(userId) === String(me._id)) continue;
      await ctx.db.insert("notifications", {
        receiverId: userId,
        senderId: me._id,
        type: "message",
        conversationId: args.conversationId,
        createdAt: now,
        read: false,
      });
    }

    return msgId;
  },
});
export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  return await ctx.storage.generateUploadUrl();
});

/*───────────────────────────────────────────
  PAGINATED MESSAGES (FAST, INDEX-BASED)
───────────────────────────────────────────*/
export const getMessagesPage = query({
  args: {
    conversationId: v.id("conversations"),
    pageSize: v.number(),
    before: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cursor = args.before ?? Date.now();

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_createdAt", (q) =>
        q.eq("conversationId", args.conversationId).lt("createdAt", cursor)
      )
      .order("desc")
      .take(args.pageSize);

    return {
      messages,
      hasMore: messages.length === args.pageSize,
      nextBefore:
        messages.length > 0
          ? messages[messages.length - 1].createdAt
          : undefined,
    };
  },
});

/*───────────────────────────────────────────
  GET USER CONVERSATIONS
───────────────────────────────────────────*/
export const getMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    // Fetch all conversations the user participates in
    const all = await ctx.db.query("conversations").collect();

    const mine = all.filter((c) =>
      c.participants.map(String).includes(String(me._id))
    );

    const results: any[] = [];

    // For each conversation, fetch recent messages (using the index) and compute unread count
    for (const c of mine) {
      // Fetch a reasonable number of recent messages for counting unread (you can increase if needed)
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversation_createdAt", (q) =>
          q.eq("conversationId", c._id)
        )
        .order("desc")
        .take(200); // LIMIT: examine most recent 200 messages — change if you expect longer unread history

      // Count messages that do NOT include current user in readBy
      let unreadCount = 0;
      for (const m of msgs) {
        const readBy = m.readBy ?? [];
        if (!readBy.map(String).includes(String(me._id))) unreadCount++;
      }

      results.push({
        ...c,
        unreadCount,
      });
    }

    // Sort by lastMessageAt (desc)
    return results.sort(
      (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
    );
  },
});

/*───────────────────────────────────────────
  MARK MESSAGES AS READ
───────────────────────────────────────────*/
export const markMessagesRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    upTo: v.number(),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);

    // Get messages <= upTo
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_createdAt", (q) =>
        q.eq("conversationId", args.conversationId).lte("createdAt", args.upTo)
      )
      .collect();

    let updated = 0;

    for (const m of messages) {
      const readBy = m.readBy ?? [];
      if (!readBy.map(String).includes(String(me._id))) {
        await ctx.db.patch(m._id, {
          readBy: [...readBy, me._id],
        });
        updated++;
      }
    }

    return { updated };
  },
});

/*───────────────────────────────────────────
  TYPING INDICATORS (NO DUPLICATES)
───────────────────────────────────────────*/
export const startTyping = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getAuthenticatedUser(ctx);
    const now = Date.now();

    // Delete old entries for this user
    const old = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    for (const e of old) {
      if (String(e.userId) === String(me._id)) {
        await ctx.db.delete(e._id);
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

export const getTypingForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const now = Date.now();

    const entries = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    return entries.filter((e) => e.expiresAt > now);
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
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    const messages = await ctx.db.query("messages").collect();

    const unread = messages.filter(
      (m) =>
        m.senderId !== me._id &&
        (!m.readBy || !m.readBy.map(String).includes(String(me._id)))
    );

    return unread.length;
  },
});

/** Count unread messages across all conversations */
export const getUnreadMessageCount = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    // fetch conversations where I'm a participant
    const conversations = await ctx.db
      .query("conversations")
      .collect();

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

export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const me = await getAuthenticatedUser(ctx);
    const msg = await ctx.db.get(messageId);
    if (!msg) throw new Error("Message not found");

    if (String(msg.senderId) !== String(me._id))
      throw new Error("Not your message");

    await ctx.db.delete(messageId);
  }
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
  }
});
/*───────────────────────────────────────────
  USER PRESENCE (Online / Last Seen)
───────────────────────────────────────────*/

/**
 * Called every time user performs an action (opening chat, sending msg, typing, navigating)
 */
export const updatePresence = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);
    const now = Date.now();

    // Check if entry exists
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

/**
 * Get presence info for another user
 * Returns: { online: boolean, lastSeen: number }
 */
export const getUserPresence = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const entry = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!entry) return { online: false, lastSeen: 0 };

    const now = Date.now();
    const diff = now - entry.lastSeen;

    // User is online if active in last 15 seconds
    const online = diff < 15000;

    return {
      online,
      lastSeen: entry.lastSeen,
    };
  },
});

/**
 * Automatically delete stale presence entries
 * (runs when presence is fetched)
 */
export const cleanupExpiredPresence = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threshold = now - 5 * 60 * 1000; // 5 minutes

    const all = await ctx.db.query("presence").collect();

    for (const p of all) {
      if (p.lastSeen < threshold) {
        await ctx.db.delete(p._id);
      }
    }
  },
});

