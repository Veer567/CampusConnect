// users.ts  
// Contains Convex mutations and utility functions related to user management.  
// Handles creating new users (synced with Clerk) and fetching authenticated user details.

import { v } from "convex/values";
import { mutation, MutationCtx, QueryCtx } from "./_generated/server";

/*───────────────────────────────────────────────
 🔹 Create a new user record (Clerk → Convex sync)
───────────────────────────────────────────────*/
export const createUser = mutation({
  args: {
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    image: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the user already exists by their Clerk ID
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    // Prevent duplicate user entries
    if (existingUser) return;

    // Insert a new user into the database with default stats
    await ctx.db.insert("users", {
      username: args.username,
      fullname: args.fullname,
      email: args.email,
      bio: args.bio,
      image: args.image,
      clerkId: args.clerkId,
      followers: 0,
      following: 0,
      posts: 0,
    });
  },
});

/*───────────────────────────────────────────────
 🔹 Get the currently authenticated user
───────────────────────────────────────────────*/
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  // Retrieve authentication identity from Clerk
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  // Find the matching user record in the Convex database
  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!currentUser) throw new Error("User not found");

  // Return the full user object for downstream use
  return currentUser;
}
