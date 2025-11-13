// users.ts
// Contains Convex mutations and utility functions related to user management.
// Handles creating new users (synced with Clerk) and fetching authenticated user details.

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

/*───────────────────────────────────────────────
 🔹 Create a new user record (Clerk → Convex sync)
───────────────────────────────────────────────*/
export const createUser = mutation({
  args: {
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    image: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the user already exists by their Clerk ID
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    // Prevent duplicate user entries
    if (existingUser) return;

    // Insert a new user into the database with default stats
    await ctx.db.insert("users", {
      username: args.username,
      fullname: args.fullname,
      email: args.email,
      bio: args.bio,
      image: args.image,
      clerkId: args.clerkId,
      followers: 0,
      following: 0,
      posts: 0,
    });
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    return user;
  },
});
export const updateUserProfile = mutation({
  args: {
    id: v.id("users"),
    fullname: v.optional(v.string()),
    bio: v.optional(v.string()),
    year: v.optional(v.string()),
    emails: v.optional(v.array(v.string())),
    departments: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    resumeUrl: v.optional(v.string()),
    resumeStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const current = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!current) throw new Error("User not found");
    if (current._id !== args.id) throw new Error("Cannot edit other profile");

    await ctx.db.patch(args.id, {
      fullname: args.fullname,
      bio: args.bio,
      year: args.year,
      emails: args.emails,
      departments: args.departments,
      interests: args.interests,
      image: args.imageUrl,
      imageStorageId: args.imageStorageId,
      resumeUrl: args.resumeUrl,
      resumeStorageId: args.resumeStorageId,
    });

    return await ctx.db.get(args.id);},
});

export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!currentUser) throw new Error("User not found");

  return currentUser;
}

export const getUserProfile = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    return user;
  },
});

export const isFollowing = query({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.followingId)
      )
      .first();

    return !!follow;
  },
});

export const toggleFollow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.followingId)
      )
      .first();

    if (existing) {
      // unfollow
      await ctx.db.delete(existing._id);
      await updateFollowCounts(ctx, currentUser._id, args.followingId, false);
    } else {
      // follow
      await ctx.db.insert("follows", {
        followerId: currentUser._id,
        followingId: args.followingId,
      });
      await updateFollowCounts(ctx, currentUser._id, args.followingId, true);

      // create a notification
      await ctx.db.insert("notifications", {
        receiverId: args.followingId,
        senderId: currentUser._id,
        type: "follow",
        createdAt: Date.now(),
      });
    }
  },
});

async function updateFollowCounts(
  ctx: MutationCtx,
  followerId: Id<"users">,
  followingId: Id<"users">,
  isFollow: boolean
) {
  const follower = await ctx.db.get(followerId);
  const following = await ctx.db.get(followingId);

  if (follower && following) {
    await ctx.db.patch(followerId, {
      following: follower.following + (isFollow ? 1 : -1),
    });
    await ctx.db.patch(followingId, {
      followers: following.followers + (isFollow ? 1 : -1),
    });
  }
}

export const getActivityStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let likes = 0;
    let bookmarks = 0;

    for (const post of posts) {
      const postLikes = await ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      likes += postLikes.length;

      const postBookmarks = await ctx.db
        .query("bookmarks")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      bookmarks += postBookmarks.length;
    }

    return {
      posts: posts.length,
      likes,
      bookmarks,
    };
  },
});


export const updateProfilePicture = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const url = await ctx.storage.getUrl(args.storageId);

    await ctx.db.patch(user._id, {
      image: url ?? undefined,
      imageStorageId: args.storageId,
    });
  },
});

