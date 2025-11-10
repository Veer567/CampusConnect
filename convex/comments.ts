import { mutation } from "./_generated/server";
import { ConvexError , v } from "convex/values";
import { getAuthenticatedUser } from "./users";


export const addComment = mutation({
    args:{
        content:v.string(),
        postId:v.id("posts")
    },

    handler:async (ctx,args) => {
        const currentUser = await getAuthenticatedUser(ctx);

        const post = await ctx.db.get(args.postId);
        if (!post) throw new ConvexError("Post not found");

        const comment = await ctx.db.insert("comments", {
            content: args.content,
            postId: args.postId,
            userId: currentUser._id
        });

        // increment comment count on post
        
    }

})