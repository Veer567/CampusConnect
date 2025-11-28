// convex/push.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, { userId, title, body, data }) => {
    // ✅ FIXED: use api.users.getUserById, not string
    const user = await ctx.runQuery(api.users.getUserById, { userId });

    if (!user?.pushToken) {
      return { ok: false, reason: "no_token" };
    }

    const payload = {
      to: user.pushToken,
      sound: "default",
      title,
      body,
      data,
    };

    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return { ok: false, reason: "expo_error" };
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, reason: String(err) };
    }
  },
});
