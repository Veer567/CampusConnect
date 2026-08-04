/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bookmark from "../bookmark.js";
import type * as chat from "../chat.js";
import type * as comments from "../comments.js";
import type * as encryption from "../encryption.js";
import type * as fcm from "../fcm.js";
import type * as http from "../http.js";
import type * as lostItems from "../lostItems.js";
import type * as marketplace from "../marketplace.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as pushTokens from "../pushTokens.js";
import type * as settings from "../settings.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  bookmark: typeof bookmark;
  chat: typeof chat;
  comments: typeof comments;
  encryption: typeof encryption;
  fcm: typeof fcm;
  http: typeof http;
  lostItems: typeof lostItems;
  marketplace: typeof marketplace;
  notifications: typeof notifications;
  posts: typeof posts;
  pushTokens: typeof pushTokens;
  settings: typeof settings;
  storage: typeof storage;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
