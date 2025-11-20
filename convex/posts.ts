// posts.ts
// Convex backend logic for handling post creation, media upload, and fetching feed posts with user metadata.

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

/*───────────────────────────────────────────────
 🔹 Generate a temporary upload URL for images
───────────────────────────────────────────────*/
export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  // Convex storage generates a temporary signed URL to upload files
  return await ctx.storage.generateUploadUrl();
});

/*───────────────────────────────────────────────
 🔹 Create a new post entry in the database
───────────────────────────────────────────────*/
export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    storageId: v.id("_storage"), // uploaded image reference
    title: v.string(),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Ensure the user is authenticated
    const currentUser = await getAuthenticatedUser(ctx);

    // Retrieve the image URL from Convex storage
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image not found");

    // Insert the new post record into the "posts" table
    const postId = await ctx.db.insert("posts", {
      userId: currentUser._id,
      userClerkId: currentUser.clerkId, // ✅ Add this
      imageUrl,
      storageId: args.storageId,
      caption: args.caption || "",
      title: args.title,
      category: args.category,
      location: args.location,
      eventDate: args.eventDate,
      likes: 0,
      comments: 0,
      tags: args.tags || [],
    });

    // Update user's total post count
    await ctx.db.patch(currentUser._id, {
      posts: currentUser.posts + 1,
    });

    return postId;
  },
});

/*───────────────────────────────────────────────
 🔹 Fetch posts for the feed (with user data)
───────────────────────────────────────────────*/
export const getFeedPosts = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const posts = await ctx.db.query("posts").order("desc").collect();
    if (posts.length === 0) return [];

    // 1) Collect authorIds and read them reactively
    const authorIds = posts.map((p) => p.userId);

    const authorDocs = await Promise.all(authorIds.map((id) => ctx.db.get(id)));

    // 2) Filter nulls safely and create map
    const authorMap = new Map(
      authorDocs
        .filter((a): a is NonNullable<typeof a> => a !== null)
        .map((a) => [a._id, a])
    );

    // 3) Build posts with author info
    const postsWithInfo = await Promise.all(
      posts.map(async (post) => {
        const postAuthor = authorMap.get(post.userId);

        // TS SAFE: If a user record is missing, skip or fallback
        if (!postAuthor) {
          return {
            ...post,
            tags: post.tags ?? [],
            author: {
              _id: { __tableName: "users" } as Id<"users">, // ✅ Correct
              username: "Unknown User",
              image: undefined,
            },
            isLiked: false,
            isBookmarked: false,
            isOwner: false,
          };
        }

        const like = await ctx.db
          .query("likes")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id)
          )
          .first();

        const bookmark = await ctx.db
          .query("bookmarks")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id)
          )
          .first();

        return {
          ...post,
          tags: post.tags ?? [],
          author: {
            _id: postAuthor._id,
            username: postAuthor.username,
            image: postAuthor.image,
          },
          isLiked: !!like,
          isBookmarked: !!bookmark,
          isOwner: post.userId === currentUser._id,
        };
      })
    );

    return postsWithInfo;
  },
});

export const toggleLikePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post) throw new Error("Post not found");

    // 🚫 Prevent user from liking their own post
    if (post.userClerkId === currentUser.clerkId) {
      return false;
    }

    // ✅ Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", currentUser._id).eq("postId", args.postId)
      )
      .first();

    if (existingLike) {
      // Unlike the post
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, {
        likes: Math.max(0, post.likes - 1),
      });
      return false;
    }

    // ✅ Like the post
    await ctx.db.insert("likes", {
      userId: currentUser._id,
      postId: args.postId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.postId, {
      likes: (post.likes ?? 0) + 1,
    });

    // ✅ Notify post owner (not self — already prevented)
    await ctx.db.insert("notifications", {
      receiverId: post.userId,
      senderId: currentUser._id,
      type: "like",
      postId: args.postId,
      createdAt: Date.now(),
    });

    return true;
  },
});

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const post = await ctx.db.get(args.postId);

    if (!post) throw new Error("Post not found");

    // verify user is the owner of the post
    if (post.userId !== currentUser._id) throw new Error("Unauthorized");

    // Delete associated likes
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete associated comments
    // Delete associated comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_target", (q) => q.eq("targetId", args.postId))
      .collect();

    for (const c of comments) {
      await ctx.db.delete(c._id);
    }

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete associated bookmarks
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    // delete storage file
    await ctx.storage.delete(post.storageId);

    // delete post
    await ctx.db.delete(args.postId);

    // Decrement user's post count
    await ctx.db.patch(currentUser._id, {
      posts: Math.max(0, (currentUser.posts || 1) - 1),
    });
  },
});

export const getPostsByUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getAuthenticatedUser(ctx);

    if (!user) throw new Error("User not found");

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId || user._id))
      .collect();
    return posts.map((p) => ({
      ...p,
      tags: p.tags || [],
    }));
  },
});

export const searchPosts = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const posts = await ctx.db.query("posts").collect();

    const trimmed = q.trim().toLowerCase();
    const isHashtag = trimmed.startsWith("#");

    // If searching tag (#...)
    if (isHashtag) {
      const tagQuery = trimmed.replace("#", ""); // remove #

      return posts.filter((p) =>
        p.tags?.some(
          (tag) => tag.toLowerCase().startsWith(tagQuery) // tag match
        )
      );
    }

    // Normal search
    return posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(trimmed) ||
        p.caption?.toLowerCase().includes(trimmed) ||
        p.category?.toLowerCase().includes(trimmed) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(trimmed))
    );
  },
});
export const editPost = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post) throw new Error("Post not found");
    if (post.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.postId, {
      title: args.title ?? post.title,
      caption: args.caption ?? post.caption,
      category: args.category ?? post.category,
      location: args.location ?? post.location,
      eventDate: args.eventDate ?? post.eventDate,
      tags: args.tags ?? post.tags, // keep tags updated
    });

    return true;
  },
});
export const getRecentPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    return await ctx.db.query("posts").order("desc").take(limit);
  },
});
