// convex/users.ts
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

/*───────────────────────────────────────────────
 🔹 Create User (Clerk → Convex)
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
    const byEmail = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (byEmail) {
      await ctx.db.patch(byEmail._id, { clerkId: args.clerkId });
      return byEmail;
    }

    const byClerk = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (byClerk) return byClerk;

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

/*───────────────────────────────────────────────
 🔐 Auth helper
───────────────────────────────────────────────*/
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) throw new Error("User not found");
  return user;
}

/*───────────────────────────────────────────────
 👥 FOLLOW / UNFOLLOW (FCM ONLY)
───────────────────────────────────────────────*/
export const toggleFollow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, { followingId }) => {
    const me = await getAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", me._id).eq("followingId", followingId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await updateFollowCounts(ctx, me._id, followingId, false);
      return;
    }

    // FOLLOW
    await ctx.db.insert("follows", {
      followerId: me._id,
      followingId,
    });
    await updateFollowCounts(ctx, me._id, followingId, true);

    // DB notification
    await ctx.db.insert("notifications", {
      receiverId: followingId,
      senderId: me._id,
      type: "follow",
      createdAt: Date.now(),
      read: false,
    });

    // 🔔 FCM push
    const target = await ctx.db.get(followingId);
    if (target?.fcmToken) {
      await ctx.scheduler.runAfter(0, api.fcm.sendFollowNotification, {
        fcmToken: target.fcmToken,
        username: me.username || me.fullname,
        userId: String(me._id),
      });
    }
  },
});

/*───────────────────────────────────────────────
 🔢 Update follow counts
───────────────────────────────────────────────*/
async function updateFollowCounts(
  ctx: MutationCtx,
  followerId: Id<"users">,
  followingId: Id<"users">,
  isFollow: boolean
) {
  const follower = await ctx.db.get(followerId);
  const following = await ctx.db.get(followingId);

  if (!follower || !following) return;

  await ctx.db.patch(followerId, {
    following: follower.following + (isFollow ? 1 : -1),
  });

  await ctx.db.patch(followingId, {
    followers: following.followers + (isFollow ? 1 : -1),
  });
}

/*───────────────────────────────────────────────
 🔔 SAVE FCM TOKEN
───────────────────────────────────────────────*/

/*───────────────────────────────────────────────
 🔍 USERS & SEARCH
───────────────────────────────────────────────*/
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
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

/*───────────────────────────────────────────────
 🧹 DELETE USER DATA
───────────────────────────────────────────────*/
export const deleteUserData = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) return;

    await ctx.db.delete(user._id);

    for (const table of ["follows", "messages", "notifications"]) {
      const rows = await ctx.db.query(table as any).collect();
      for (const r of rows) {
        if (
          r.followerId === user._id ||
          r.followingId === user._id ||
          r.senderId === user._id ||
          r.receiverId === user._id
        ) {
          await ctx.db.delete(r._id);
        }
      }
    }
  },
});
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});
export const getUserProfile = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    return user;
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
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthenticatedUser(ctx);
  },
});
/*───────────────────────────────────────────────
 ✏️ UPDATE USER PROFILE
───────────────────────────────────────────────*/
/*───────────────────────────────────────────────
 ✏️ UPDATE USER PROFILE (SAFE + STRICT)
───────────────────────────────────────────────*/
export const updateUserProfile = mutation({
  args: {
    fullname: v.optional(v.string()),
    bio: v.optional(v.string()),
    image: v.optional(v.string()),
    departments: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    emails: v.optional(v.array(v.string())), // secondary only
    resumeUrl: v.optional(v.string()),
    year: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const updates: any = {};

    if (args.fullname !== undefined) updates.fullname = args.fullname;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.image !== undefined) updates.image = args.image;
    if (args.departments !== undefined) updates.departments = args.departments;
    if (args.interests !== undefined) updates.interests = args.interests;
    if (args.emails !== undefined) updates.emails = args.emails;
    if (args.resumeUrl !== undefined) updates.resumeUrl = args.resumeUrl;
    if (args.year !== undefined) updates.year = args.year;

    await ctx.db.patch(user._id, updates);
    return await ctx.db.get(user._id);
  },
});
