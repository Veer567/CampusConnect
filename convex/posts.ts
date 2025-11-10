// posts.ts  
// Convex backend logic for handling post creation, media upload, and fetching feed posts with user metadata.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";
import { use } from "react";

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
      imageUrl,
      storageId: args.storageId,
      caption: args.caption || "",
      title: args.title,
      category: args.category,
      location: args.location,
      eventDate: args.eventDate,
      likes: 0,
      comments: 0,
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

    // Fetch all posts in descending order (newest first)
    const posts = await ctx.db.query("posts").order("desc").collect();
    if (posts.length === 0) return [];

    // For each post, append author info and user interaction status
    const postsWithInfo = await Promise.all(
      posts.map(async (post) => {
        const postAuthor = (await ctx.db.get(post.userId))!;

        // Check if the current user has liked this post
        const like = await ctx.db
          .query("likes")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id)
          )
          .first();

        // Check if the current user has bookmarked this post
        const bookmark = await ctx.db
          .query("bookmarks")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id)
          )
          .first();

        // Return post along with author and user interaction flags
        return {
          ...post,
          author: {
            _id: postAuthor?._id,
            username: postAuthor?.username,
            image: postAuthor?.image,
          },
          isLiked: !!like,
          isBookmarked: !!bookmark,
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

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", currentUser._id).eq("postId", args.postId)
      )
      .first();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (existing) {
      // Unlike the post
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, { likes: Math.max(0, post.likes - 1) });
      return false;
    } else {
      // Like the post
      await ctx.db.insert("likes", {
        userId: currentUser._id,
        postId: args.postId,
      });
      await ctx.db.patch(args.postId, { likes: (post.likes || 0) + 1 });

      // Send notification to post owner (if not self)
      if (currentUser._id !== post.userId) {
        await ctx.db.insert("notifications", {
          receiverId: post.userId,
          senderId: currentUser._id,
          type: "like",
          postId: args.postId,
         createdAt: Date.now(),

          
        });
      }

      return true;
    }
  },
});



