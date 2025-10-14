import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";



export default defineSchema({
    users: defineTable({
        username: v.string(),
        fullname: v.string(),
        email: v.string(),
        bio: v.optional(v.string()),
        image: v.string(),
        followers: v.number(),
        following: v.number(),
        posts: v.number(),
        clerkId: v.string(),
    }).index("by_clerk_Id", ["clerkId"]),

    posts: defineTable({
        userId: v.id("users"),
        imageUrl: v.string(),
        storageId: v.id("_storage"),
        caption: v.optional(v.string()),
        likes: v.number(),
        comments: v.number(),
    }).index("by_userId", ["userId"]),

    likes: defineTable({
        postId: v.id("posts"),
        userId: v.id("users"),
    }).index("by_post", ["postId"])
    .index("by_userId_and_post", ["userId", "postId"],),

    comments: defineTable({
        postId: v.id("posts"),
        userId: v.id("users"),
        content: v.string(),
    }).index("by_post", ["postId"]),

    follows: defineTable({
        followerId: v.id("users"),
        followingId: v.id("users"),
    }).index("by_followerId", ["followerId"])
        .index("by_followingId", ["followingId"])
        .index("by_both", ["followerId", "followingId"]),

    notifications: defineTable({
        reciverId: v.id("users"),
        senderId: v.id("users"),
        type: v.union(v.literal("like"), v.literal("comment"), v.literal("follow")),
        postId: v.optional(v.id("posts")),
        comment: v.optional(v.id("comments")),
        
    }).index("by_reciverId", ["reciverId"]),

    bookmarks: defineTable({
        userId: v.id("users"),
        postId: v.id("posts"),
    }).index("by_userId", ["userId"])
        .index("by_post", ["postId"])
        .index("by_userId_and_postId", ["userId", "postId"]),

}); 