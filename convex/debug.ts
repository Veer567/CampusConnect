// convex/debug.ts
import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation } from "./_generated/server";

/**
 * SIMPLE DEBUG: Return current timestamp (to verify function runs)
 */
export const ping = action({
  args: {},
  handler: async (): Promise<{ ok: boolean; time: number }> => {
    return { ok: true, time: Date.now() };
  },
});

/**
 * TEST PUSH WITH DIRECT ACTION (no scheduler)
 */
export const testPushAction = action({
  args: { userId: v.id("users") },

  // 👇 explicit handler type annotation fixes TS7022 + TS7023
  handler: async (
    ctx,
    { userId }
  ): Promise<{ ok: boolean; reason?: string }> => {
    const res = await ctx.runAction(api.push.sendPushNotification, {
      userId,
      senderName: "Convex Debug",
      senderAvatar: undefined,
      messages: ["Convex Action Test"],
      chatId: "DEBUG_CHAT",
      screen: "/",
      tab: "/(tabs)/home",
    });

    // ensure type is exactly what we return
    if (res.ok) return { ok: true };
    return { ok: false, reason: res.reason };
  },
});

/**
 * TEST PUSH WITH SCHEDULER
 */
export const testPushScheduler = mutation({
  args: { userId: v.id("users") },

  // 👇 explicit handler type
  handler: async (ctx, { userId }): Promise<{ scheduled: boolean }> => {
    await ctx.scheduler.runAfter(0, api.push.sendPushNotification, {
      userId,
      senderName: "Convex Scheduler",
      senderAvatar: undefined,
      messages: ["Scheduler works!"],
      chatId: "DEBUG_CHAT",
      screen: "/",
      tab: "/(tabs)/home",
    });

    return { scheduled: true };
  },
});
