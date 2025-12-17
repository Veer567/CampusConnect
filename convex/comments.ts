// convex/comments.ts
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/*───────────────────────────────────────────────
 🔹 Extract @Full Name mentions
───────────────────────────────────────────────*/
function extractFullnameMentions(text: string): string[] {
  if (!text) return [];
  const re = /@([A-Za-z0-9À-ÖØ-öø-ÿ'’\-\.\s]{2,80}?)\b/g;
  const out = new Set<string>();

  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    if (name) out.add(name);
  }

  return [...out];
}

/*───────────────────────────────────────────────
 🔹 Find users by fullname (case-insensitive)
───────────────────────────────────────────────*/
async function findUsersByFullnames(ctx: any, names: string[]) {
  if (!names.length) return [];
  const users = await ctx.db.query("users").collect();

  const map = new Map<string, any>();
  for (const u of users) {
    if (u.fullname) map.set(u.fullname.toLowerCase(), u);
  }

  return names
    .map((n) => map.get(n.toLowerCase()))
    .filter(Boolean);
}

/*───────────────────────────────────────────────
 🔔 DB notification + FCM push
───────────────────────────────────────────────*/
async function notifyUsers(
  ctx: any,
  receivers: any[],
  sender: any,
  opts: {
    type: "comment" | "reply" | "mention";
    postId?: Id<"posts">;
    commentId?: Id<"comments">;
    title: string;
    body: string;
  }
) {
  const now = Date.now();

  for (const r of receivers) {
    if (!r || String(r._id) === String(sender._id)) continue;

    // 1️⃣ Save DB notification
    await ctx.db.insert("notifications", {
      receiverId: r._id,
      senderId: sender._id,
      type: opts.type,
      postId: opts.postId,
      commentId: opts.commentId,
      createdAt: now,
      read: false,
    });

    // 2️⃣ Send FCM
    if (!r.fcmToken) continue;

    await ctx.scheduler.runAfter(0, api.fcm.sendCommentNotification, {
      fcmToken: r.fcmToken,
      title: opts.title,
      body: opts.body,
      postId: opts.postId ? String(opts.postId) : undefined,
      commentId: opts.commentId ? String(opts.commentId) : undefined,
      type: opts.type,
    });
  }
}


/*───────────────────────────────────────────────
 🔹 Get target (post / marketplace)
───────────────────────────────────────────────*/
async function getTarget(
  ctx: any,
  targetType: "post" | "marketplace",
  targetId: any
) {
  const target = await ctx.db.get(targetId);
  return target ? { ...target, type: targetType } : null;
}

/*───────────────────────────────────────────────
 💬 ADD COMMENT
───────────────────────────────────────────────*/
export const addComment = mutation({
  args: {
    targetId: v.union(v.id("posts"), v.id("marketplacePosts")),
    targetType: v.union(v.literal("post"), v.literal("marketplace")),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, { targetId, targetType, content, parentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!me) throw new Error("User not found");

    const now = Date.now();

    // Insert comment
    const commentId = await ctx.db.insert("comments", {
      userId: me._id,
      targetId,
      targetType,
      content,
      parentId,
      createdAt: now,
    });

    const target = await getTarget(ctx, targetType, targetId);
    if (!target) return commentId;

    // Increment post comment count (top-level only)
    if (targetType === "post" && !parentId) {
      await ctx.db.patch(targetId, {
        comments: (target.comments ?? 0) + 1,
      });
    }

    /*──────── Comment → Post owner ────────*/
    if (!parentId) {
      const ownerId =
        targetType === "post" ? target.userId : target.creatorId;

      if (String(ownerId) !== String(me._id)) {
        const owner = await ctx.db.get(ownerId);

        await notifyUsers(ctx, [owner], me, {
          type: "comment",
          postId: targetType === "post" ? (targetId as Id<"posts">) : undefined,
          commentId,
          title: `${me.username ?? me.fullname} commented`,
          body:
            content.length > 100 ? content.slice(0, 100) + "…" : content,
        });
      }
    }

    /*──────── Reply → Parent owner ────────*/
    if (parentId) {
      const parent = await ctx.db.get(parentId);
      if (parent && String(parent.userId) !== String(me._id)) {
        const parentOwner = await ctx.db.get(parent.userId);

        await notifyUsers(ctx, [parentOwner], me, {
          type: "reply",
          postId: targetType === "post" ? (targetId as Id<"posts">) : undefined,
          commentId,
          title: `${me.username ?? me.fullname} replied`,
          body:
            content.length > 100 ? content.slice(0, 100) + "…" : content,
        });
      }
    }

    /*──────── Mentions ────────*/
    const mentions = extractFullnameMentions(content);
    if (mentions.length) {
      const users = await findUsersByFullnames(ctx, mentions);

      await notifyUsers(ctx, users, me, {
        type: "mention",
        postId: targetType === "post" ? (targetId as Id<"posts">) : undefined,
        commentId,
        title: `${me.username ?? me.fullname} mentioned you`,
        body:
          content.length > 100 ? content.slice(0, 100) + "…" : content,
      });
    }

    return commentId;
  },
});

/*───────────────────────────────────────────────
 📥 GET COMMENTS
───────────────────────────────────────────────*/
export const getComments = query({
  args: {
    targetId: v.union(v.id("posts"), v.id("marketplacePosts")),
  },
  handler: async (ctx, { targetId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_target", (q) => q.eq("targetId", targetId))
      .order("desc")
      .collect();

    return Promise.all(
      comments
        .filter((c) => !c.parentId)
        .map(async (c) => {
          const user = await ctx.db.get(c.userId);
          const replies = await ctx.db
            .query("comments")
            .withIndex("by_parent", (q) => q.eq("parentId", c._id))
            .collect();

          return {
            ...c,
            replyCount: replies.length,
            user: {
              _id: user?._id,
              username: user?.username ?? "",
              fullname: user?.fullname ?? "",
              image: user?.image ?? null,
            },
          };
        })
    );
  },
});
export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!me) throw new Error("User not found.");

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found.");

    const target = await getTarget(
      ctx,
      comment.targetType as "post" | "marketplace",
      comment.targetId
    );
    if (!target) throw new Error("Target not found.");

    const isCommentOwner = String(comment.userId) === String(me._id);
    const isPostOwner =
      (comment.targetType === "post" &&
        String(target.userId) === String(me._id)) ||
      (comment.targetType === "marketplace" &&
        String(target.creatorId) === String(me._id));

    if (!isCommentOwner && !isPostOwner) {
      throw new Error("Not authorized to delete");
    }

    // delete replies
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", commentId))
      .collect();

    for (const r of replies) await ctx.db.delete(r._id);

    // delete comment
    await ctx.db.delete(commentId);

    // decrement post comment count (posts only & top-level only)
    if (!comment.parentId && comment.targetType === "post") {
      await ctx.db.patch(comment.targetId as Id<"posts">, {
        comments: Math.max(0, (target.comments ?? 1) - 1),
      });
    }

    return true;
  },
});
export const getReplies = query({
  args: { parentId: v.id("comments") },
  handler: async (ctx, { parentId }) => {
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .order("asc")
      .collect();

    return Promise.all(
      replies.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return {
          ...r,
          user: {
            username: user?.username ?? "",
            fullname: user?.fullname ?? "",
            image: user?.image ?? null,
            _id: user?._id,
          },
        };
      })
    );
  },
});

