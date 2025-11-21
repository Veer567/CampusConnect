// convex/push.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

/*----------------------------------------------------------
  SAVE DEVICE EXPO PUSH TOKEN
-----------------------------------------------------------*/
export const savePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);

    await ctx.db.patch(me._id, {
      pushToken: args.token,
    });

    return true;
  },
});

/*----------------------------------------------------------
  SEND EXPO PUSH NOTIFICATION
-----------------------------------------------------------*/
export const sendPushNotification = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user?.pushToken) return;

    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.pushToken,
          title: args.title,
          body: args.body,
          sound: "default",
          data: args.data ?? {},
        }),
      });
    } catch (err) {
      console.error("Expo push error:", err);
    }
  },
});
