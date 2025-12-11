import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    chatId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    screen: v.optional(v.string()),
    tab: v.optional(v.string())
  },

  handler: async (ctx, args) => {
    const { userId, title, body, chatId, messageId, screen, tab } = args;

    const user = await ctx.runQuery(api.users.getUserById, { userId });
    if (!user?.pushToken) return { ok: false, reason: "no_token" };

    const payload = {
      to: user.pushToken,
      title,
      body,
      sound: "default",
      priority: "high",
      channelId: "messages",

      android: {
        groupId: "chat_messages",
        groupSummary: false,
        actions: [
          { identifier: "REPLY", buttonTitle: "Reply", textInput: { submitButtonTitle: "Send" } },
          { identifier: "MARK_AS_READ", buttonTitle: "Mark as Read" }
        ]
      },

      data: {
        screen: screen ?? "/chat/[id]",
        params: { id: chatId, highlight: messageId },
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
