// schema.ts  
// This Convex schema defines all database tables, their fields, and indexes  
// for the CampusConnect social platform — including users, posts, likes, comments, follows, notifications, and bookmarks.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /*───────────────────────────────
   🔹 Users Table
   Stores user profiles with stats.
  ───────────────────────────────*/
  users: defineTable({
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    image: v.string(),
    followers: v.number(),
    following: v.number(),
    posts: v.number(),
    clerkId: v.string(), // maps to Clerk’s unique ID
  }).index("by_clerk_id", ["clerkId"]),

  /*───────────────────────────────
   🔹 Posts Table
   Contains uploaded content and event data.
  ───────────────────────────────*/
  posts: defineTable({
    userId: v.id("users"),
    imageUrl: v.string(),
    storageId: v.id("_storage"), // link to Convex file storage
    caption: v.optional(v.string()),
    likes: v.number(),
    comments: v.number(),
    title: v.optional(v.string()), 
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    eventDate: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  /*───────────────────────────────
   🔹 Likes Table
   Tracks which user liked which post.
  ───────────────────────────────*/
  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),

  /*───────────────────────────────
   🔹 Comments Table
   Stores post comments with text and user references.
  ───────────────────────────────*/
  comments: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    content: v.string(),
  }).index("by_post", ["postId"]),

  /*───────────────────────────────
   🔹 Follows Table
   Handles following relationships between users.
  ───────────────────────────────*/
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_both", ["followerId", "followingId"]),

  /*───────────────────────────────
   🔹 Notifications Table
   Used for user interactions like likes, comments, and follows.
  ───────────────────────────────*/
  notifications: defineTable({
    receiverId: v.id("users"),
    senderId: v.id("users"),
    type: v.union(v.literal("like"), v.literal("comment"), v.literal("follow")),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
  })
    .index("by_receiver", ["receiverId"])
    .index("by_post", ["postId"]),

  /*───────────────────────────────
   🔹 Bookmarks Table
   Allows users to save posts.
  ───────────────────────────────*/
  bookmarks: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),
});
