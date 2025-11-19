// lostItems.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users"; // you already have this helper

export const addLostItem = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.union(v.literal("lost"), v.literal("found")),
    category: v.optional(v.string()),          // ✅ NEW FIELD
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    return await ctx.db.insert("lostItems", {
      title: args.title,
      description: args.description,
      imageUrl: args.imageUrl ?? "",
      location: args.location,
      status: args.status,
      category: args.category ?? "Other",       // ✅ DEFAULT
      reporterId: user._id,
      reporterName: user.fullname,
      reporterImage: user.image ?? "",          // ✅ STORE PROFILE IMAGE
      createdAt: Date.now(),
    });
  },
});

export const markItemFound = mutation({
  args: { id: v.id("lostItems") },
  handler: async (ctx, { id }) => {
    const current = await getAuthenticatedUser(ctx);

    const item = await ctx.db.get(id);
    if (!item) throw new Error("Item not found");

    // Only the reporter or admin may mark as found (simple check: reporter)
    if (item.reporterId !== current._id) throw new Error("Unauthorized");

    await ctx.db.patch(id, { status: "found" });
    return await ctx.db.get(id);
  },
});

export const getLostItems = query({
  args: {
    status: v.optional(v.union(v.literal("lost"), v.literal("found"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit = 50 }) => {
    if (status) {
      return await ctx.db
        .query("lostItems")
        .withIndex("by_status", (qq) => qq.eq("status", status))
        .order("desc")
        .take(limit);
    }
    // fallback order by createdAt
    return await ctx.db.query("lostItems").order("desc").take(limit);
  },
});

export const getLostItemById = query({
  args: { id: v.id("lostItems") },
  handler: async (ctx, { id }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Item not found");
    return item;
  },
});

export const getMyLostItems = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("lostItems")
      .withIndex("by_reporter", (q) => q.eq("reporterId", userId))
      .order("desc")
      .collect();
  },
});

export const searchLostItems = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const items = await ctx.db.query("lostItems").collect();
    const qLower = q.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(qLower) ||
        (i.description && i.description.toLowerCase().includes(qLower)) ||
        (i.location && i.location.toLowerCase().includes(qLower))
    );
  },
});
export const deleteLostItem = mutation({
  args: { id: v.id("lostItems") },
  handler: async (ctx, { id }) => {
    const user = await getAuthenticatedUser(ctx);

    const item = await ctx.db.get(id);
    if (!item) throw new Error("Item not found");

    // Only item owner can delete
    if (item.reporterId !== user._id) {
      throw new Error("Unauthorized: You can only delete your own item.");
    }

    await ctx.db.delete(id);
    return true;
  },
});
// UPDATE LOST ITEM
export const updateLostItem = mutation({
  args: {
    id: v.id("lostItems"),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.union(v.literal("lost"), v.literal("found")),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      title: args.title,
      description: args.description,
      category: args.category,
      status: args.status,
      location: args.location,
      imageUrl: args.imageUrl,
    });
  },
});
export const getItemById = query({
  args: { id: v.id("lostItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

