// lostItems.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

/*───────────────────────────────────────────────
  CREATE LOST ITEM (IMAGE REQUIRED, STORAGE SAFE)
───────────────────────────────────────────────*/
export const addLostItem = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.id("_storage"),
    location: v.optional(v.string()),
    status: v.union(v.literal("lost"), v.literal("found")),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
    if (!imageUrl) throw new Error("Invalid image upload");

    return await ctx.db.insert("lostItems", {
      title: args.title,
      description: args.description,
      imageStorageId: args.imageStorageId,
      imageUrl,
      location: args.location,
      status: args.status,
      category: args.category ?? "Other",
      reporterId: user._id,
      reporterName: user.fullname,
      reporterImage: user.image,
      createdAt: Date.now(),
    });
  },
});

/*───────────────────────────────────────────────
  GET LOST ITEMS (FILTERED)
───────────────────────────────────────────────*/
export const getLostItems = query({
  args: {
    status: v.optional(v.union(v.literal("lost"), v.literal("found"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit = 50 }) => {
    if (status) {
      return await ctx.db
        .query("lostItems")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("lostItems").order("desc").take(limit);
  },
});

/*───────────────────────────────────────────────
  GET SINGLE ITEM
───────────────────────────────────────────────*/
export const getLostItemById = query({
  args: { id: v.id("lostItems") },
  handler: async (ctx, { id }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Item not found");
    return item;
  },
});

/*───────────────────────────────────────────────
  GET USER'S LOST ITEMS
───────────────────────────────────────────────*/
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

/*───────────────────────────────────────────────
  SEARCH LOST ITEMS
───────────────────────────────────────────────*/
export const searchLostItems = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const items = await ctx.db.query("lostItems").collect();
    const qLower = q.toLowerCase();

    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(qLower) ||
        i.description?.toLowerCase().includes(qLower) ||
        i.location?.toLowerCase().includes(qLower)
    );
  },
});

/*───────────────────────────────────────────────
  UPDATE LOST ITEM (SAFE IMAGE REPLACEMENT)
───────────────────────────────────────────────*/
export const updateLostItem = mutation({
  args: {
    id: v.id("lostItems"),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.union(v.literal("lost"), v.literal("found")),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const item = await ctx.db.get(args.id);

    if (!item) throw new Error("Item not found");
    if (item.reporterId !== user._id) throw new Error("Unauthorized");

    let imageUrl = item.imageUrl;
    let imageStorageId = item.imageStorageId;

    if (args.imageStorageId && args.imageStorageId !== item.imageStorageId) {
      // delete old image
      try {
        if (item.imageStorageId) {
          await ctx.storage.delete(item.imageStorageId);
        }
      } catch {}

      const url = await ctx.storage.getUrl(args.imageStorageId);
      if (!url) throw new Error("Invalid image upload");

      imageUrl = url;
      imageStorageId = args.imageStorageId;
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      description: args.description,
      location: args.location,
      category: args.category,
      status: args.status,
      imageUrl,
      imageStorageId,
    });
  },
});

/*───────────────────────────────────────────────
  DELETE LOST ITEM (CLEANS STORAGE)
───────────────────────────────────────────────*/
export const deleteLostItem = mutation({
  args: { id: v.id("lostItems") },
  handler: async (ctx, { id }) => {
    const user = await getAuthenticatedUser(ctx);
    const item = await ctx.db.get(id);

    if (!item) throw new Error("Item not found");
    if (item.reporterId !== user._id) throw new Error("Unauthorized");

    if (item.imageStorageId) {
      try {
        await ctx.storage.delete(item.imageStorageId);
      } catch {}
    }

    await ctx.db.delete(id);
    return true;
  },
});

/*───────────────────────────────────────────────
  MARK ITEM AS FOUND
───────────────────────────────────────────────*/
export const markItemFound = mutation({
  args: { id: v.id("lostItems") },
  handler: async (ctx, { id }) => {
    const user = await getAuthenticatedUser(ctx);
    const item = await ctx.db.get(id);

    if (!item) throw new Error("Item not found");
    if (item.reporterId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(id, { status: "found" });
    return await ctx.db.get(id);
  },
});

/*───────────────────────────────────────────────
  MARK ITEM AS REUNITED (ARCHIVE EVENT)
───────────────────────────────────────────────*/
export const markItemReunited = mutation({
  args: { id: v.id("lostItems") },
  handler: async (ctx, { id }) => {
    const user = await getAuthenticatedUser(ctx);
    const item = await ctx.db.get(id);

    if (!item) throw new Error("Item not found");
    if (item.reporterId !== user._id) throw new Error("Unauthorized");

    await ctx.db.insert("reunitedEvents", {
      itemId: id,
      reporterId: user._id,
      reporterName: user.fullname,
      reporterImage: user.image,
      createdAt: Date.now(),
    });

    if (item.imageStorageId) {
      try {
        await ctx.storage.delete(item.imageStorageId);
      } catch {}
    }

    await ctx.db.delete(id);
    return true;
  },
});

/*───────────────────────────────────────────────
  LOST / FOUND STATS
───────────────────────────────────────────────*/
export const getLostFoundStats = query({
  handler: async (ctx) => {
    const lost = await ctx.db
      .query("lostItems")
      .withIndex("by_status", (q) => q.eq("status", "lost"))
      .collect();

    const found = await ctx.db
      .query("lostItems")
      .withIndex("by_status", (q) => q.eq("status", "found"))
      .collect();

    const reunited = await ctx.db.query("reunitedEvents").collect();

    return {
      lostCount: lost.length,
      foundCount: found.length,
      reunitedCount: reunited.length,
    };
  },
});
