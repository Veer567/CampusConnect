import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    senderName: v.string(),
    senderAvatar: v.optional(v.string()),
    messages: v.array(v.string()),  // message thread
    chatId: v.string(),
    screen: v.optional(v.string()),
    tab: v.optional(v.string())
  },

  handler: async (ctx, args) => {
    const {
      userId,
      senderName,
      senderAvatar,
      messages,
      chatId,
      screen,
      tab
    } = args;

    const user = await ctx.runQuery(api.users.getUserById, { userId });
    if (!user?.pushToken) return { ok: false, reason: "no_token" };

    // Convert messages into Android MessagingStyle format
    const formattedMessages = messages.map((text) => ({
      text,
      timestamp: Date.now(),
      person: {
        name: senderName,
        icon: senderAvatar
      }
    }));

    const payload = {
      to: user.pushToken,
      priority: "high",
      channelId: "messages",

      android: {
        // ⭐ Messaging Style (WhatsApp-like notifications)
        style: {
          type: "messaging",
          conversationTitle: senderName,
          messages: formattedMessages,
          person: {
            name: senderName,
            icon: senderAvatar
          }
        },

        // Grouping by chat (multiple messages collapse)
        groupId: chatId,
        groupSummary: false,

        actions: [
          {
            identifier: "REPLY",
            buttonTitle: "Reply",
            textInput: { submitButtonTitle: "Send" }
          },
          {
            identifier: "MARK_AS_READ",
            buttonTitle: "Mark as Read"
          }
        ]
      },

      data: {
        screen: screen ?? "/chat/[id]",
        params: { id: chatId },
        tab: tab ?? "/(tabs)/messages"
      }
    };

    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) return { ok: false, reason: "expo_error" };

      return { ok: true };
    } catch (err) {
      return { ok: false, reason: String(err) };
    }
  }
});
