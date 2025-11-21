// convex/comments.ts
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/*───────────────────────────────────────────────
 🔹 Helper: load correct target (post or marketplacePost)
───────────────────────────────────────────────*/
async function getTarget(
  ctx: any,
  targetType: "post" | "marketplace",
  targetId: any
) {
  const target = await ctx.db.get(targetId);
  if (!target) return null;
  return { ...target, type: targetType };
}

/*───────────────────────────────────────────────
 🔹 Add Comment
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

    // Update post comments count
    if (targetType === "post") {
      await ctx.db.patch(targetId, {
        comments: (target.comments ?? 0) + 1,
      });
    }

    // Determine who is notified
    const receiverId = targetType === "post" ? target.userId : target.creatorId;

    // no self notifications
    if (String(receiverId) !== String(me._id)) {
      await ctx.db.insert("notifications", {
        receiverId,
        senderId: me._id,
        type: "comment",
        postId: targetType === "post" ? (targetId as Id<"posts">) : undefined,
        commentId,
        createdAt: now,
      });

      // PUSH Notification
      await ctx.runMutation(api.push.sendPushNotification, {
        userId: receiverId,
        title: `${me.username} commented on your ${
          targetType === "post" ? "post" : "listing"
        }`,
        body: content.length > 80 ? content.slice(0, 80) + "…" : content,
        data: {
          type: targetType === "post" ? "comment_post" : "comment_marketplace",
          postId: targetType === "post" ? (targetId as Id<"posts">) : undefined,
          marketplaceId:
            targetType === "marketplace"
              ? (targetId as Id<"marketplacePosts">)
              : undefined,
          commentId,
        },
      });
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
    const userId = me._id;

    const c = await ctx.db.get(commentId);
    if (!c) throw new Error("Comment not found.");

    if (String(c.userId) !== String(userId)) {
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
    const userId = me._id;

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found.");

    const target = await getTarget(
      ctx,
      comment.targetType as "post" | "marketplace",
      comment.targetId
    );
    if (!target) throw new Error("Target not found.");

    const isOwner = String(comment.userId) === String(userId);
    const isPostOwner =
      (comment.targetType === "post" &&
        String(target.userId) === String(userId)) ||
      (comment.targetType === "marketplace" &&
        String(target.creatorId) === String(userId));

    if (!isOwner && !isPostOwner) {
      throw new Error("Not authorized to delete");
    }

    // delete replies
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", commentId))
      .collect();

    for (const r of replies) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.delete(commentId);

    // decrement comment count (posts only, and only for top-level)
    if (!comment.parentId && comment.targetType === "post") {
      await ctx.db.patch(comment.targetId as Id<"posts">, {
        comments: Math.max(0, (target.comments ?? 1) - 1),
      });
    }

    return true;
  },
});
