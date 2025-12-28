// convex/fcm.ts
"use node";
import admin from "firebase-admin";
import { v } from "convex/values";

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
 🧩 Helpers
──────────────────────────────────────────────*/
function stringify(data?: Record<string, any>) {
  if (!data) return undefined;
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );
}

function truncate(text: string, max = 70) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
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
        title: `💬 New message from ${args.senderName}`,
        body: truncate(args.message, 80),
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
        title: "❤️ Someone liked your post",
        body: `${args.username} showed some love on your post`,
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
        title: "👤 You have a new follower",
        body: `${args.username} is now following you`,
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

    const titleMap = {
      comment: "💬 New comment on your post",
      reply: "↩️ Someone replied to your comment",
      mention: "📣 You were mentioned",
    };

    await app.messaging().send({
      token: args.fcmToken,
      notification: {
        title: titleMap[args.type],
        body: truncate(args.body, 80),
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
        title: `📢 ${args.title}`,
        body: truncate(args.body, 90),
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
        title: "🚀 Notifications are live!",
        body: "Everything is set up correctly. You’re good to go 🎉",
      },
      android: {
        priority: "high",
        notification: { channelId: "messages" },
      },
    });

    return { ok: true };
  },
});
