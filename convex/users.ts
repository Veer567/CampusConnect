// users.ts
// Contains Convex mutations and utility functions related to user management.
// Handles creating new users (synced with Clerk) and fetching authenticated user details.

import { v } from "convex/values";
import { api } from "./_generated/api";
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
    // 1️⃣ If a Convex user already exists with this email → restore profile, update clerkId
    const existingByEmail = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingByEmail) {
      await ctx.db.patch(existingByEmail._id, {
        clerkId: args.clerkId,
      });
      return existingByEmail;
    }

    // 2️⃣ If user exists with this clerkId → do nothing
    const existingByClerkId = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingByClerkId) return existingByClerkId;

    // 3️⃣ Create new user
    return await ctx.db.insert("users", {
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

    return await ctx.db.get(args.id);
  },
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
      // FOLLOW
      await ctx.db.insert("notifications", {
        receiverId: args.followingId,
        senderId: currentUser._id,
        type: "follow",
        createdAt: Date.now(),
        read: false,
      });

      // PUSH Notification
      await ctx.scheduler.runAfter(0, api.push.sendPushNotification, {
        userId: args.followingId,
        senderName: currentUser.username || currentUser.fullname,
        senderAvatar: currentUser.image ?? undefined,
        messages: [`${currentUser.username} started following you`],
        chatId: "FOLLOW_EVENT", // not a real chat, but required
        screen: "/profile/[id]",
        tab: "/(tabs)/home",
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
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return { likes: likes.length, bookmarks: bookmarks.length };
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

export const searchUsers = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const users = await ctx.db.query("users").collect();
    return users.filter((u) =>
      u.fullname.toLowerCase().includes(q.toLowerCase())
    );
  },
});
export const saveRecentSearch = mutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    // remove duplicates
    const existing = await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("query"), args.query))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { createdAt: Date.now() });
      return;
    }

    // insert new
    await ctx.db.insert("recentSearches", {
      userId: args.userId,
      query: args.query,
      createdAt: Date.now(),
    });
  },
});

export const getRecentSearches = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});
// Get users you follow + users who follow you
export const getMentionUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) return [];

    // following = users I follow
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", me._id))
      .collect();

    // followers = users who follow me
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", me._id))
      .collect();

    const userIds = new Set([
      ...following.map((f) => f.followingId),
      ...followers.map((f) => f.followerId),
    ]);

    const users = await Promise.all(
      [...userIds].map(async (id) => {
        return await ctx.db.get(id);
      })
    );

    return users.filter(Boolean).map((u) => ({
      _id: u!._id,
      username: u!.username,
      fullname: u!.fullname,
      image: u!.image,
    }));
  },
});
export const getFollowers = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const target = args.userId
      ? await ctx.db.get(args.userId)
      : await getAuthenticatedUser(ctx);

    if (!target) return [];

    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", target._id))
      .collect();

    return Promise.all(
      followers.map(async (f) => await ctx.db.get(f.followerId))
    );
  },
});

export const getFollowing = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const target = args.userId
      ? await ctx.db.get(args.userId)
      : await getAuthenticatedUser(ctx);

    if (!target) return [];

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", target._id))
      .collect();

    return Promise.all(
      following.map(async (f) => await ctx.db.get(f.followingId))
    );
  },
});
// in convex/users.ts (append)

export const savePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) throw new Error("User not found");

    await ctx.db.patch(me._id, { pushToken: token });
    return { ok: true };
  },
});
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});
export const deleteUserData = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) return;

    // Delete user record
    await ctx.db.delete(user._id);

    // Delete follows
    const follows = await ctx.db.query("follows").collect();
    for (const f of follows) {
      if (
        String(f.followerId) === String(user._id) ||
        String(f.followingId) === String(user._id)
      ) {
        await ctx.db.delete(f._id);
      }
    }

    // Delete presence
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (presence) await ctx.db.delete(presence._id);

    // Delete messages & conversations references
    const messages = await ctx.db.query("messages").collect();
    for (const m of messages) {
      if (String(m.senderId) === String(user._id)) {
        await ctx.db.delete(m._id);
      }
    }

    // Delete notifications
    const notifications = await ctx.db.query("notifications").collect();
    for (const n of notifications) {
      if (
        String(n.receiverId) === String(user._id) ||
        String(n.senderId) === String(user._id)
      ) {
        await ctx.db.delete(n._id);
      }
    }
  },
});
