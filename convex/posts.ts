// convex/posts.ts
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

/**
 * Helper: extract mentions using @Full Name style
 * Returns array of matched mention strings (trimmed).
 * Example: "hey @Viral Bhojani and @John Doe" -> ["Viral Bhojani", "John Doe"]
 */
function extractFullnameMentions(text: string | undefined): string[] {
  if (!text) return [];
  const matches: string[] = [];
  // match '@' followed by letters, spaces, punctuation allowed in names
  const re = /@([A-Za-z0-9À-ÖØ-öø-ÿ'’\-\.\s]{2,80}?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1].trim();
    if (raw) {
      matches.push(raw);
    }
  }
  // unique and preserve order
  return Array.from(new Set(matches));
}

/**
 * Helper: find users by fullname (case-insensitive exact match)
 * NOTE: This is naive because Convex doesn't support robust text search in server-side indexes.
 * For small user counts this is fine; for large scale implement an index or normalized-fullname field.
 */
async function findUsersByFullnames(ctx: any, fullnames: string[]) {
  if (!fullnames || fullnames.length === 0) return [];
  const allUsers = await ctx.db.query("users").collect();
  const lowerMap = new Map<string, any>();
  for (const u of allUsers) {
    if (!u?.fullname) continue;
    lowerMap.set(String(u.fullname).toLowerCase(), u);
  }
  const out = [];
  for (const name of fullnames) {
    const candidate = lowerMap.get(name.toLowerCase());
    if (candidate) out.push(candidate);
  }
  return out;
}

/**
 * Helper: create notifications + send push via your push mutation
 * - ctx: mutation context
 * - receivers: array of user docs (Convex user rows)
 * - sender: user doc of actor
 * - opts: { type, postId?, commentId?, conversationId?, title, body, data }
 */
async function notifyUsers(
  ctx: any,
  receivers: any[],
  sender: any,
  opts: {
    type: "like" | "comment" | "mention" | "reply" | "message" | string;
    postId?: Id<"posts"> | undefined;
    commentId?: Id<"comments"> | undefined;
    conversationId?: Id<"conversations"> | undefined;
    title: string;
    body: string;
    data?: any;
  }
) {
  const now = Date.now();

  for (const r of receivers) {
    if (!r || String(r._id) === String(sender._id)) continue;

    // Insert notification row
    await ctx.db.insert("notifications", {
      receiverId: r._id,
      senderId: sender._id,
      type: opts.type,
      postId: opts.postId,
      commentId: opts.commentId,
      conversationId: opts.conversationId,
      createdAt: now,
      read: false,
    });

    // Push Notification (scheduled)
    await ctx.scheduler.runAfter(0, api.push.sendPushNotification, {
      userId: r._id,
      title: opts.title,
      body: opts.body,
      data: opts.data ?? { type: opts.type, postId: opts.postId },
    });
  }
}

/*──────────────────────────────────────────────────────────
  Create Post (with mention detection in title/caption)
──────────────────────────────────────────────────────────*/
export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    storageId: v.id("_storage"),
    title: v.string(),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // retrieve uploaded image url
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image upload not found");

    // insert post
    const postId = await ctx.db.insert("posts", {
      userId: currentUser._id,
      userClerkId: currentUser.clerkId,
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
      createdAt: Date.now(),
    });

    // increment post count for user
    await ctx.db.patch(currentUser._id, {
      posts: (currentUser.posts ?? 0) + 1,
    });

    // -------------- mentions in title/caption --------------
    const mentions = extractFullnameMentions(
      `${args.title} ${args.caption ?? ""}`
    );
    if (mentions.length > 0) {
      const users = await findUsersByFullnames(ctx, mentions);
      if (users.length > 0) {
        await notifyUsers(ctx, users, currentUser, {
          type: "mention",
          postId,
          title: `${currentUser.username || currentUser.fullname} mentioned you`,
          body:
            (args.caption && args.caption.length > 100
              ? args.caption.slice(0, 100) + "…"
              : args.caption) ||
            args.title ||
            "You were mentioned",
          data: { type: "mention_post", postId },
        });
      }
    }

    return postId;
  },
});

/*──────────────────────────────────────────────────────────
  Get feed posts (unchanged logic, plus author map)
──────────────────────────────────────────*/
export const getFeedPosts = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const posts = await ctx.db.query("posts").order("desc").collect();
    if (posts.length === 0) return [];

    const authorIds = posts.map((p) => p.userId);
    const authorDocs = await Promise.all(authorIds.map((id) => ctx.db.get(id)));

    const authorMap = new Map(
      authorDocs
        .filter((a): a is NonNullable<typeof a> => a !== null)
        .map((a) => [a._id, a])
    );

    const postsWithInfo = await Promise.all(
      posts.map(async (post) => {
        const postAuthor = authorMap.get(post.userId);

        if (!postAuthor) {
          return {
            ...post,
            tags: post.tags ?? [],
            author: { _id: null, username: "Unknown", image: undefined },
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
            fullname: postAuthor.fullname,
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

/*──────────────────────────────────────────────────────────
  Toggle Like (keeps original behavior, plus notification)
──────────────────────────────────────────*/
export const toggleLikePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Block liking own posts
    if (String(post.userId) === String(currentUser._id)) {
      return { liked: false, likes: post.likes ?? 0 };
    }

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", currentUser._id).eq("postId", args.postId)
      )
      .first();

    if (existing) {
      // unlike
      await ctx.db.delete(existing._id);
      const newLikes = Math.max(0, (post.likes ?? 1) - 1);
      await ctx.db.patch(args.postId, { likes: newLikes });
      return { liked: false, likes: newLikes };
    }

    // like
    const now = Date.now();
    await ctx.db.insert("likes", {
      userId: currentUser._id,
      postId: args.postId,
      createdAt: now,
    });

    const newLikes = (post.likes ?? 0) + 1;
    await ctx.db.patch(args.postId, { likes: newLikes });

    // Notification to post owner (if not self)
    const postOwner = await ctx.db.get(post.userId);
    if (postOwner && String(postOwner._id) !== String(currentUser._id)) {
      await notifyUsers(ctx, [postOwner], currentUser, {
        type: "like",
        postId: args.postId,
        title: `${currentUser.username || currentUser.fullname} liked your post`,
        body: post.title ?? "Someone liked your post",
        data: { type: "like", postId: args.postId },
      });
    }

    return { liked: true, likes: newLikes };
  },
});

/*──────────────────────────────────────────────────────────
  Delete post (keeps original flow)
──────────────────────────────────────────*/
export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (String(post.userId) !== String(currentUser._id))
      throw new Error("Unauthorized");

    // delete likes
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);

    // delete comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_target", (q) => q.eq("targetId", args.postId))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);

    // delete bookmarks
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const b of bookmarks) await ctx.db.delete(b._id);

    // delete storage file (best-effort)
    try {
      if (post.storageId) await ctx.storage.delete(post.storageId);
    } catch (e) {
      console.warn("failed to delete storage:", e);
    }

    await ctx.db.delete(args.postId);

    // decrement user's post count
    await ctx.db.patch(currentUser._id, {
      posts: Math.max(0, (currentUser.posts ?? 1) - 1),
    });
  },
});

/*──────────────────────────────────────────────────────────
  Other read helpers (unchanged)
──────────────────────────────────────────*/
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
    return posts.map((p) => ({ ...p, tags: p.tags || [] }));
  },
});

export const searchPosts = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const posts = await ctx.db.query("posts").collect();
    const trimmed = q.trim().toLowerCase();
    const isHashtag = trimmed.startsWith("#");
    if (isHashtag) {
      const tagQuery = trimmed.replace("#", "");
      return posts.filter((p) =>
        p.tags?.some((tag) => tag.toLowerCase().startsWith(tagQuery))
      );
    }
    return posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(trimmed) ||
        p.caption?.toLowerCase().includes(trimmed) ||
        p.category?.toLowerCase().includes(trimmed) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(trimmed))
    );
  },
});

export const getRecentPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    return await ctx.db.query("posts").order("desc").take(limit);
  },
});

// posts.ts
// Convex backend logic for handling post creation, media upload, and fetching feed posts with user metadata.

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

/*───────────────────────────────────────────────
 🔹 Fetch posts for the feed (with user data)
───────────────────────────────────────────────*/

export const editPost = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // ✅ ADD THIS
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post) throw new Error("Post not found");
    if (post.userId !== user._id) throw new Error("Unauthorized");

    // 🔥 If image changed, delete old one
    if (args.storageId && post.storageId && args.storageId !== post.storageId) {
      try {
        await ctx.storage.delete(post.storageId);
      } catch {}
    }

    // 🔥 Get new image URL if storageId updated
    const imageUrl = args.storageId
      ? await ctx.storage.getUrl(args.storageId)
      : post.imageUrl;

    await ctx.db.patch(args.postId, {
      title: args.title ?? post.title,
      caption: args.caption ?? post.caption,
      category: args.category ?? post.category,
      location: args.location ?? post.location,
      eventDate: args.eventDate ?? post.eventDate,
      tags: args.tags ?? post.tags,

      // ✅ update image if changed
      imageUrl: imageUrl ?? undefined,
      storageId: args.storageId ?? post.storageId,
    });

    return true;
  },
});
export const getLikedPosts = query({
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Get all liked items by user
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (!likes.length) return [];

    // Fetch all posts
    const posts = await Promise.all(
      likes.map(async (l) => {
        const post = await ctx.db.get(l.postId);
        return post ? { ...post, likeId: l._id } : null;
      })
    );

    return posts.filter(Boolean);
  },
});
/*───────────────────────────────────────────────
 🔹 Get a single post by ID (full details)
───────────────────────────────────────────────*/
export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const user = await getAuthenticatedUser(ctx);

    const post = await ctx.db.get(postId);
    if (!post) return null;

    const author = await ctx.db.get(post.userId);

    // Check like
    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", user._id).eq("postId", postId)
      )
      .first();

    // Check bookmark
    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", user._id).eq("postId", postId)
      )
      .first();

    return {
      ...post,
      author: author
        ? {
            _id: author._id,
            username: author.username,
            image: author.image,
          }
        : null,
      tags: post.tags ?? [],
      isLiked: !!like,
      isBookmarked: !!bookmark,
      isOwner: post.userId === user._id,
    };
  },
});
export const toggleBookmark = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();

    // 🔄 Unbookmark
    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }

    // ⭐ Bookmark
    await ctx.db.insert("bookmarks", {
      userId: user._id,
      postId: args.postId,
    });

    return { bookmarked: true };
  },
});
export const getActivityStats = query({
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      likes: likes.length,
      bookmarks: bookmarks.length,
    };
  },
});
