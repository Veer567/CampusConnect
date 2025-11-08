// clerkWebhook.ts  
// This file defines an HTTP route that securely handles Clerk webhook events inside a Convex backend.  
// The purpose is to verify the incoming webhook, confirm it's from Clerk, and process user creation events.

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // ✅ Ensure webhook secret is configured properly in the environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRECT;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    // ✅ Extract necessary Svix headers from the request
    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    // Validate the headers (all are required for verification)
    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("Error occurred -- no svix headers", {
        status: 400,
      });
    }

    // ✅ Parse webhook body as JSON
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // ✅ Initialize Svix webhook verification client
    const wh = new Webhook(webhookSecret);
    let evt: any;

    // 🔒 Verify that the request really came from Clerk
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occurred", { status: 400 });
    }

    // ✅ Extract event type to handle different webhook events
    const eventType = evt.type;

    // 🎯 Handle user creation event
    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      // Extract primary email and construct a clean full name
      const email = email_addresses[0].email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        // Save new user to Convex database using users.createUser mutation
        await ctx.runMutation(api.users.createUser, {
          email,
          fullname: name,
          image: image_url,
          clerkId: id,
          username: email.split("@")[0], // use prefix of email as username
        });
      } catch (error) {
        console.log("Error creating user:", error);
        return new Response("Error creating user", { status: 500 });
      }
    }

    // ✅ Respond with success (even if no matching event type)
    return new Response("Webhook processed successfully", { status: 200 });
  }),
});

export default http;
