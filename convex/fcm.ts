// convex/fcm.ts
"use node";

import { v } from "convex/values";
import admin from "firebase-admin";
import { action } from "./_generated/server";

/*──────────────────────────────────────────────
 🔐 Firebase Admin Singleton (SAFE)
──────────────────────────────────────────────*/
let firebaseApp: admin.app.App | null = null;

function getFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyB64 = process.env.FIREBASE_PRIVATE_KEY_B64;

  if (!projectId || !clientEmail || !privateKeyB64) {
    throw new Error("❌ Missing Firebase Admin environment variables");
  }

  const privateKey = Buffer.from(privateKeyB64, "base64").toString("utf8");

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return firebaseApp;
}

/*──────────────────────────────────────────────
 🧩 Helper: stringify FCM data payload
──────────────────────────────────────────────*/
function stringify(data?: Record<string, any>) {
  if (!data) return undefined;
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );
}

/*──────────────────────────────────────────────
 💬 MESSAGE (Chat)
──────────────────────────────────────────────*/
export const sendMessageNotification = action({
  args: {
    fcmToken: v.string(),
    senderName: v.string(),
    message: v.string(),
    conversationId: v.string(),
  },
  handler: async (_, args) => {
    const app = getFirebaseAdmin();

    await app.messaging().send({
      token: args.fcmToken,
      notification: {
        title: args.senderName,
        body: args.message,
      },
      data: stringify({
        screen: "/notification-redirect",
        type: "message",
        conversationId: args.conversationId,
      }),

      android: {
        priority: "high",
        notification: { channelId: "messages" },
      },
    });

    return { ok: true };
  },
});

/*──────────────────────────────────────────────
 ❤️ LIKE
──────────────────────────────────────────────*/
export const sendLikeNotification = action({
  args: {
    fcmToken: v.string(),
    username: v.string(),
    postId: v.string(),
  },
  handler: async (_, args) => {
    const app = getFirebaseAdmin();

    await app.messaging().send({
      token: args.fcmToken,
      notification: {
        title: "❤️ New Like",
        body: `${args.username} liked your post`,
      },
      data: stringify({
        screen: "/notification-redirect",
        type: "post",
        postId: args.postId,
      }),

      android: {
        priority: "normal",
        notification: { channelId: "default" },
      },
    });

    return { ok: true };
  },
});

/*──────────────────────────────────────────────
 👤 FOLLOW
──────────────────────────────────────────────*/
export const sendFollowNotification = action({
  args: {
    fcmToken: v.string(),
    username: v.string(),
    userId: v.string(),
  },
  handler: async (_, args) => {
    const app = getFirebaseAdmin();

    await app.messaging().send({
      token: args.fcmToken,
      notification: {
        title: "👤 New Follower",
        body: `${args.username} started following you`,
      },
      data: stringify({
        screen: "/notification-redirect",
        type: "profile",
        userId: args.userId,
      }),

      android: {
        priority: "normal",
        notification: { channelId: "default" },
      },
    });

    return { ok: true };
  },
});

/*──────────────────────────────────────────────
 💬 COMMENT / REPLY / MENTION
──────────────────────────────────────────────*/
export const sendCommentNotification = action({
  args: {
    fcmToken: v.string(),
    title: v.string(),
    body: v.string(),
    postId: v.optional(v.string()),
    commentId: v.optional(v.string()),
    type: v.union(
      v.literal("comment"),
      v.literal("reply"),
      v.literal("mention")
    ),
  },
  handler: async (_, args) => {
    const app = getFirebaseAdmin();

    await app.messaging().send({
      token: args.fcmToken,
      notification: {
        title: args.title,
        body: args.body,
      },
      data: stringify({
        screen: "/notification-redirect",
        type: args.type,
        postId: args.postId,
        commentId: args.commentId,
      }),

      android: {
        priority: "high",
        notification: { channelId: "default" },
      },
    });

    return { ok: true };
  },
});

/*──────────────────────────────────────────────
 📢 ANNOUNCEMENT
──────────────────────────────────────────────*/
export const sendAnnouncementNotification = action({
  args: {
    fcmToken: v.string(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (_, args) => {
    const app = getFirebaseAdmin();

    await app.messaging().send({
      token: args.fcmToken,
      notification: {
        title: args.title,
        body: args.body,
      },
      android: {
        priority: "high",
        notification: { channelId: "announcements" },
      },
    });

    return { ok: true };
  },
});

/*──────────────────────────────────────────────
 🧪 TEST NOTIFICATION
──────────────────────────────────────────────*/
export const sendTestNotification = action({
  args: { fcmToken: v.string() },
  handler: async (_, { fcmToken }) => {
    const app = getFirebaseAdmin();

    await app.messaging().send({
      token: fcmToken,
      notification: {
        title: "🔥 Test Notification",
        body: "If you see this, FCM is working!",
      },
      android: {
        priority: "high",
        notification: { channelId: "messages" },
      },
    });

    return { ok: true };
  },
});
