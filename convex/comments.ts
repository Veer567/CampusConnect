// convex/comments.ts
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/*───────────────────────────────────────────────
 🔹 Helper: extract mentions using @Full Name
───────────────────────────────────────────────*/
function extractFullnameMentions(text: string): string[] {
  if (!text) return [];

  const re = /@([A-Za-z0-9À-ÖØ-öø-ÿ'’\-\.\s]{2,80}?)\b/g;
  const found = new Set<string>();

  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1].trim();
    if (raw) found.add(raw);
  }

  return [...found];
}

/*───────────────────────────────────────────────
 🔹 Helper: find users by FULLNAME (case-insensitive)
───────────────────────────────────────────────*/
async function findUsersByFullnames(ctx: any, names: string[]) {
  if (!names.length) return [];
  const allUsers = await ctx.db.query("users").collect();

  const map = new Map<string, any>();
  for (const u of allUsers) {
    if (u.fullname) map.set(u.fullname.toLowerCase(), u);
  }

  const result = [];
  for (const name of names) {
    const u = map.get(name.toLowerCase());
    if (u) result.push(u);
  }
  return result;
}

/*───────────────────────────────────────────────
 🔹 Helper: send DB notification + push
───────────────────────────────────────────────*/
async function notifyUsers(ctx: any, receivers: any[], sender: any, opts: any) {
  const now = Date.now();

  for (const r of receivers) {
    if (!r || String(r._id) === String(sender._id)) continue; // no self

    // Insert notification
    await ctx.db.insert("notifications", {
      receiverId: r._id,
      senderId: sender._id,
      type: opts.type,
      postId: opts.postId,
      commentId: opts.commentId,
      createdAt: now,
      read: false,
    });

    // Push notification via Expo
    await ctx.runMutation(api.push.sendPushNotification, {
      userId: r._id,
      title: opts.title,
      body: opts.body,
      data: opts.data ?? {},
    });
  }
}

/*───────────────────────────────────────────────
 🔹 Helper: fetch post or marketplace item
───────────────────────────────────────────────*/
async function getTarget(ctx: any, targetType: "post" | "marketplace", targetId: any) {
  const target = await ctx.db.get(targetId);
  return target ? { ...target, type: targetType } : null;
}

/*───────────────────────────────────────────────
 🔹 Add Comment (with comment, reply & mention notifications)
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
    if (!identity) throw new Error("Not authenticated.");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) throw new Error("User not found.");

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

    // increment post comment count only for top-level comments
    if (targetType === "post" && !parentId) {
      await ctx.db.patch(targetId, {
        comments: (target.comments ?? 0) + 1,
      });
    }

    /*─────────────────────────────────────────────
     🔸 Case 1: Comment on post → notify post owner
    ─────────────────────────────────────────────*/
    const postOwnerId = targetType === "post" ? target.userId : target.creatorId;

    if (!parentId && String(postOwnerId) !== String(me._id)) {
      const postOwner = await ctx.db.get(postOwnerId);

      await notifyUsers(ctx, [postOwner], me, {
        type: "comment",
        postId: targetType === "post" ? targetId : undefined,
        commentId,
        title: `${me.username ?? me.fullname} commented`,
        body: content.length > 100 ? content.slice(0, 100) + "…" : content,
        data: {
          type: "comment",
          postId: targetType === "post" ? targetId : undefined,
          commentId,
        },
      });
    }

    /*─────────────────────────────────────────────
     🔸 Case 2: Reply → notify parent comment owner
    ─────────────────────────────────────────────*/
    if (parentId) {
      const parentComment = await ctx.db.get(parentId);

      if (parentComment && String(parentComment.userId) !== String(me._id)) {
        const parentOwner = await ctx.db.get(parentComment.userId);

        await notifyUsers(ctx, [parentOwner], me, {
          type: "reply",
          postId: targetType === "post" ? targetId : undefined,
          commentId,
          title: `${me.username ?? me.fullname} replied to your comment`,
          body: content.length > 100 ? content.slice(0, 100) + "…" : content,
          data: {
            type: "reply",
            postId: targetType === "post" ? targetId : undefined,
            commentId,
          },
        });
      }
    }

    /*─────────────────────────────────────────────
     🔸 Case 3: Mentions inside comment → notify mentioned users
    ─────────────────────────────────────────────*/
    const mentions = extractFullnameMentions(content);

    if (mentions.length > 0) {
      const mentionedUsers = await findUsersByFullnames(ctx, mentions);

      if (mentionedUsers.length > 0) {
        await notifyUsers(ctx, mentionedUsers, me, {
          type: "mention",
          postId: targetType === "post" ? targetId : undefined,
          commentId,
          title: `${me.username ?? me.fullname} mentioned you`,
          body: content.length > 100 ? content.slice(0, 100) + "…" : content,
          data: {
            type: "mention",
            postId: targetType === "post" ? targetId : undefined,
            commentId,
          },
        });
      }
    }

    return commentId;
  },
});

/*───────────────────────────────────────────────
 🔹 Get Comments (top level)
───────────────────────────────────────────────*/
export const getComments = query({
  args: {
    targetId: v.union(v.id("posts"), v.id("marketplacePosts")),
  },
  handler: async (ctx, { targetId }) => {
    const all = await ctx.db
      .query("comments")
      .withIndex("by_target", (q) => q.eq("targetId", targetId))
      .order("desc")
      .collect();

    const top = all.filter((c) => !c.parentId);

    return Promise.all(
      top.map(async (c) => {
        const user = await ctx.db.get(c.userId);

        const replies = await ctx.db
          .query("comments")
          .withIndex("by_parent", (q) => q.eq("parentId", c._id))
          .collect();

        return {
          ...c,
          replyCount: replies.length,
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

/*───────────────────────────────────────────────
 🔹 Get Replies
───────────────────────────────────────────────*/
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

/*───────────────────────────────────────────────
 🔹 Edit Comment
───────────────────────────────────────────────*/
export const editComment = mutation({
  args: { commentId: v.id("comments"), text: v.string() },
  handler: async (ctx, { commentId, text }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!me) throw new Error("User not found.");

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found.");

    if (String(comment.userId) !== String(me._id)) {
      throw new Error("Not authorized.");
    }

    await ctx.db.patch(commentId, {
      content: text,
      editedAt: Date.now(),
    });

    return true;
  },
});

/*───────────────────────────────────────────────
 🔹 Delete Comment
───────────────────────────────────────────────*/
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

    const target = await getTarget(ctx, comment.targetType as "post" | "marketplace", comment.targetId);
    if (!target) throw new Error("Target not found.");

    const isCommentOwner = String(comment.userId) === String(me._id);
    const isPostOwner =
      (comment.targetType === "post" && String(target.userId) === String(me._id)) ||
      (comment.targetType === "marketplace" && String(target.creatorId) === String(me._id));

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
