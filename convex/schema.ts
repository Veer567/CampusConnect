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
    createdAt: v.optional(v.number()),
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
    .index("by_user_and_post", ["userId", "postId"])
    .index("by_user", ["userId"]),

  /*───────────────────────────────
   🔹 Comments Table
  ───────────────────────────────*/
  comments: defineTable({
    userId: v.id("users"),

    targetId: v.union(v.id("posts"), v.id("marketplacePosts")),

    targetType: v.string(), // "post" | "marketplace"

    content: v.string(),
    createdAt: v.number(),

    parentId: v.optional(v.id("comments")), // reply threads
    mentions: v.optional(v.array(v.id("users"))),
    editedAt: v.optional(v.number()),
  })
    .index("by_target", ["targetId"])
    .index("by_parent", ["parentId"]),

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

    // Add new types here
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("reply"),
      v.literal("mention"),
      v.literal("follow"),
      v.literal("message")
    ),

    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    createdAt: v.number(),
    read: v.optional(v.boolean()),
    conversationId: v.optional(v.id("conversations")),
  })
    .index("by_receiver", ["receiverId"])
    .index("by_post", ["postId"]),

  /*───────────────────────────────
   🔹 Bookmarks Tabl
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
    category: v.optional(v.string()), // category
    reporterId: v.id("users"),
    reporterName: v.string(),
    reporterContact: v.optional(v.string()), // contact
    reporterImage: v.optional(v.string()), // profile image
    createdAt: v.number(), // timestamp
  })
    .index("by_status", ["status"])
    .index("by_reporter", ["reporterId"])
    .index("by_created", ["createdAt"]),
  reunitedEvents: defineTable({
    itemId: v.id("lostItems"),
    reporterId: v.id("users"),
    reporterName: v.string(),
    reporterImage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_item", ["itemId"]),

  marketplacePosts: defineTable({
    /*───────────────────────────────
   🔹 Creator Info
  ───────────────────────────────*/
    creatorId: v.id("users"),
    creatorName: v.string(),
    creatorImage: v.optional(v.string()),

    /*───────────────────────────────
   🔹 Post Type (Top Tabs)
   project | hackathon | startup
  ───────────────────────────────*/
    type: v.union(
      v.literal("project"),
      v.literal("hackathon"),
      v.literal("startup")
    ),

    /*───────────────────────────────
   🔹 Main Content
  ───────────────────────────────*/
    title: v.string(),
    description: v.string(),
    tags: v.optional(v.array(v.string())), // chips/tags

    /*───────────────────────────────
   🔹 Recruitment Section
  ───────────────────────────────*/
    lookingFor: v.optional(v.string()), // free text (Q1 Option 2)

    /*───────────────────────────────
   🔹 Dates
  ───────────────────────────────*/
    eventDate: v.optional(v.string()), // hackathons / events
    lastDateToJoin: v.optional(v.string()), // optional field

    /*───────────────────────────────
   🔹 Optional Image
  ───────────────────────────────*/
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),

    /*───────────────────────────────
   🔹 Interest System
  ───────────────────────────────*/
    interestedUsers: v.optional(v.array(v.id("users"))),

    /*───────────────────────────────
   🔹 Timestamp
  ───────────────────────────────*/
    createdAt: v.number(),

    // ⭐ NEW
    location: v.optional(v.string()),
  })
    .index("by_creator", ["creatorId"])
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),

  supportMessages: defineTable({
    userId: v.id("users"),
    email: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  reportedIssues: defineTable({
    userId: v.id("users"),
    issue: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
