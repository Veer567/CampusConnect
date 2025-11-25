// convex/push.ts
import axios from "axios";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const sendPushNotification = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, { userId, title, body, data }) => {
    const user = await ctx.db.get(userId);
    if (!user?.pushToken) {
      // no token -> skip
      return { ok: false, reason: "no_token" };
    }

    try {
      const payload = {
        to: user.pushToken,
        sound: "default",
        title,
        body,
        data,
      };

      // axios POST to Expo
      await axios.post("https://exp.host/--/api/v2/push/send", payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 7000,
      });

      return { ok: true };
    } catch (err) {
      console.error("sendPushNotification error:", err);
      return { ok: false, reason: String(err) };
    }
  },
});
