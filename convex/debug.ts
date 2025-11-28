// convex/debug.ts
import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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
      title: "Convex Action Test",
      body: "Your push action works!",
      data: { debug: true },
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
  handler: async (
    ctx,
    { userId }
  ): Promise<{ scheduled: boolean }> => {
    await ctx.scheduler.runAfter(0, api.push.sendPushNotification, {
      userId,
      title: "Convex Scheduler Test",
      body: "Scheduler works!",
      data: { debug: true },
    });

    return { scheduled: true };
  },
});
