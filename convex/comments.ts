import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

/*───────────────────────────────────────────────
 🔹 Add new comment
───────────────────────────────────────────────*/
export const addComments = mutation({
  args: {
    content: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    await ctx.db.insert("comments", {
      userId: currentUser._id,
      postId: args.postId,
      content: args.content,
    });

    // Optionally increment comment count on the post
    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, {
        comments: (post.comments ?? 0) + 1,
      });
    }
  },
});

/*───────────────────────────────────────────────
 🔹 Get comments for a post (with username)
───────────────────────────────────────────────*/
export const getComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    // Fetch comments for this post
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .order("desc")
      .collect();

    // Attach each comment's username & image (like getFeedPosts)
    const commentsWithUser = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: {
            username: user?.username ?? "UnknownUser",
            image: user?.image ?? null,
          },
        };
      })
    );

    return commentsWithUser;
  },
});
