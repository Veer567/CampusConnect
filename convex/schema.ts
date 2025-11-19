// schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /*───────────────────────────────
   🔹 Users Table
  ───────────────────────────────*/
  users: defineTable({
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    emails: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    image: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    resumeUrl: v.optional(v.string()),
    resumeStorageId: v.optional(v.id("_storage")),
    year: v.optional(v.string()),
    departments: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    followers: v.number(),
    following: v.number(),
    posts: v.number(),
    clerkId: v.string(),
    isOnboarded: v.optional(v.boolean()),

    // 🔥 required for push notifications
    pushToken: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  /*───────────────────────────────
   🔹 Posts Table
  ───────────────────────────────*/
  posts: defineTable({
    userId: v.id("users"),
    userClerkId: v.optional(v.string()),
    imageUrl: v.string(),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    likes: v.number(),
    comments: v.number(),
    title: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  }).index("by_user", ["userId"]),

  /*───────────────────────────────
   🔹 Likes Table
  ───────────────────────────────*/
  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.optional(v.number()),
  })
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),

  /*───────────────────────────────
   🔹 Comments Table
  ───────────────────────────────*/
  comments: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    content: v.string(),
  }).index("by_post", ["postId"]),

  /*───────────────────────────────
   🔹 Follows Table
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
  ───────────────────────────────*/
  notifications: defineTable({
    receiverId: v.id("users"),
    senderId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("message") // 🔥 added for chat notifications
    ),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    createdAt: v.number(),
  })
    .index("by_receiver", ["receiverId"])
    .index("by_post", ["postId"]),

  /*───────────────────────────────
   🔹 Bookmarks Table
  ───────────────────────────────*/
  bookmarks: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),

  /*───────────────────────────────
   🔥 CHAT SYSTEM BELOW
  ───────────────────────────────*/

  /*───────────────────────────────
   🔹 Conversations Table
  ───────────────────────────────*/
  conversations: defineTable({
    participants: v.array(v.id("users")),
    title: v.optional(v.string()), // for group chat
    imageUrl: v.optional(v.string()), // group image
    lastMessage: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    isGroup: v.optional(v.boolean()),
  }).index("by_participant", ["participants"]),

  /*───────────────────────────────
   🔹 Messages Table
  ───────────────────────────────*/
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),

    text: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),

    createdAt: v.number(),
    readBy: v.optional(v.array(v.id("users"))),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"])
    .index("by_conversation_createdAt", ["conversationId", "createdAt"]),

  /*───────────────────────────────
   🔹 Typing Indicator Table
  ───────────────────────────────*/
  typing: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  recentSearches: defineTable({
    userId: v.id("users"),
    query: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  lostItems: defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  imageStorageId: v.optional(v.id("_storage")),
  imageUrl: v.optional(v.string()),
  location: v.optional(v.string()),
  status: v.union(v.literal("lost"), v.literal("found")),
  category: v.optional(v.string()),                 // category
  reporterId: v.id("users"),
  reporterName: v.string(),
  reporterContact: v.optional(v.string()),          // contact
  reporterImage: v.optional(v.string()),            // profile image
  createdAt: v.number(),                            // timestamp
})
  .index("by_status", ["status"])
  .index("by_reporter", ["reporterId"])
  .index("by_created", ["createdAt"])          // ⬅ correct

});