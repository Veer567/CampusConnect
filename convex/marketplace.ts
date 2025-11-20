import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/*----------------------------------------------------------
  📌 Create Marketplace Post
-----------------------------------------------------------*/
export const createMarketplacePost = mutation(
  async (
    ctx,
    input: {
      type: "project" | "hackathon" | "startup";
      title: string;
      description: string;
      tags?: string[];
      lookingFor?: string;
      eventDate?: string;
      lastDateToJoin?: string;
      imageUrl?: string;
      imageStorageId?: Id<"_storage">;
      location?: string;
    }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!creator) throw new Error("User profile not found.");

    const doc = {
      creatorId: creator._id,
      creatorName: creator.fullname ?? creator.username,
      creatorImage: creator.image,

      type: input.type,
      title: input.title,
      description: input.description,
      tags: input.tags ?? [],

      lookingFor: input.lookingFor,
      eventDate: input.eventDate,
      lastDateToJoin: input.lastDateToJoin,

      imageUrl: input.imageUrl,
      imageStorageId: input.imageStorageId,
      location: input.location,

      interestedUsers: [],

      createdAt: Date.now(),
    };

    return await ctx.db.insert("marketplacePosts", doc);
  }
);

/*----------------------------------------------------------
  📌 Get posts by type
-----------------------------------------------------------*/
export const getMarketplacePosts = query(
  async (ctx, input: { type: "project" | "hackathon" | "startup" }) => {
    return await ctx.db
      .query("marketplacePosts")
      .withIndex("by_type", (q) => q.eq("type", input.type))
      .order("desc")
      .collect();
  }
);

/*----------------------------------------------------------
  📌 Get post by ID
-----------------------------------------------------------*/
export const getMarketplacePostById = query(
  async (ctx, input: { id: Id<"marketplacePosts"> }) => {
    return await ctx.db.get(input.id);
  }
);

/*----------------------------------------------------------
  📌 Toggle Interest Button
-----------------------------------------------------------*/
export const toggleInterestOnPost = mutation(
  async (ctx, input: { postId: Id<"marketplacePosts"> }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) throw new Error("User not found.");

    const post = await ctx.db.get(input.postId);
    if (!post) throw new Error("Post not found.");

    const interested = post.interestedUsers ?? [];
    const hasInterest = interested.includes(me._id);

    const updated = hasInterest
      ? interested.filter((id) => id !== me._id)
      : [...interested, me._id];

    await ctx.db.patch(input.postId, { interestedUsers: updated });

    return {
      interestedCount: updated.length,
      nowInterested: !hasInterest,
    };
  }
);

/*----------------------------------------------------------
  📌 Create or Get 1:1 Conversation
-----------------------------------------------------------*/
export const createOrGetConversation = mutation(
  async (ctx, input: { creatorId: Id<"users"> }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me) throw new Error("User not found.");

    // Find existing conversation
    const conversations = await ctx.db
      .query("conversations")
      .collect()
      .then((all) =>
        all.filter(
          (c) =>
            c.participants &&
            c.participants.map(String).includes(String(me._id))
        )
      );

    const existing = conversations.find((c) =>
      c.participants.includes(input.creatorId)
    );

    if (existing) return existing._id;

    // Create new conversation (NO null fields)
    const conv = {
      participants: [me._id, input.creatorId],
      isGroup: false,
      createdBy: me._id,
      title: undefined,
      imageUrl: undefined,
      lastMessage: undefined,
      lastMessageAt: undefined,
    };

    return await ctx.db.insert("conversations", conv);
  }
);

export const deleteMarketplacePost = mutation(
  async (ctx, input: { id: Id<"marketplacePosts"> }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const post = await ctx.db.get(input.id);
    if (!post) throw new Error("Post not found.");

    // Ensure only creator can delete
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me || post.creatorId !== me._id)
      throw new Error("You cannot delete this post.");

    await ctx.db.delete(input.id);
    return true;
  }
);
export const updateMarketplacePost = mutation(
  async (
    ctx,
    input: {
      id: Id<"marketplacePosts">;
      title?: string;
      description?: string;
      tags?: string[];
      lookingFor?: string;
      eventDate?: string;
      lastDateToJoin?: string;
      imageUrl?: string;
      location?: string;
    }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const post = await ctx.db.get(input.id);
    if (!post) throw new Error("Post not found.");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!me || post.creatorId !== me._id)
      throw new Error("You cannot edit this post.");

    await ctx.db.patch(input.id, {
      title: input.title,
      description: input.description,
      tags: input.tags,
      lookingFor: input.lookingFor,
      eventDate: input.eventDate,
      lastDateToJoin: input.lastDateToJoin,
      imageUrl: input.imageUrl,
      location: input.location,
    });

    return true;
  }
);


