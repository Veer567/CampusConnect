// app/search.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/themes";

/* -------------------------------------------------------
   🔄 Debounce Hook — Instant Search with Delay
------------------------------------------------------- */
function useDebounce(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value]);

  return debounced;
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  const debouncedQuery = useDebounce(query, 300);
  const trimmed = debouncedQuery.trim().toLowerCase();

  const { user } = useUser();
  const clerkId = user?.id;

  // My Convex user
  const me = useQuery(api.users.getUserByClerkId, {
    clerkId: clerkId || "",
  });

  // Queries
  const users = useQuery(api.users.searchUsers, { q: trimmed || "" });
  const posts = useQuery(api.posts.searchPosts, { q: trimmed || "" });
  const recentPosts = useQuery(api.posts.getRecentPosts);
  const recentSearches = useQuery(
    api.users.getRecentSearches,
    me ? { userId: me._id } : "skip"
  );

  // Save search
  const saveRecentSearch = useMutation(api.users.saveRecentSearch);

  const isHashtag = query.startsWith("#");
  const tagLower = query.replace("#", "").toLowerCase();

  /* -------------------------------------------------------
     👤 Filter Users
  ------------------------------------------------------- */
  const filteredUsers =
    trimmed.length > 0 && !isHashtag
      ? users?.filter(
          (u: any) =>
            u.clerkId !== clerkId &&
            u.fullname?.toLowerCase().includes(trimmed)
        ) ?? []
      : [];

  /* -------------------------------------------------------
     📝 Filter Posts
  ------------------------------------------------------- */
  const filteredPosts =
    trimmed.length > 0
      ? isHashtag
        ? posts?.filter((p: any) =>
            p.tags?.some((t: string) =>
              t.toLowerCase().startsWith(tagLower)
            )
          ) ?? []
        : posts?.filter((p: any) =>
            p.title?.toLowerCase().includes(trimmed)
          ) ?? []
      : [];

  /* -------------------------------------------------------
     💾 Save Search
  ------------------------------------------------------- */
  const saveSearch = () => {
    if (me && trimmed.length > 0) {
      saveRecentSearch({ userId: me._id, query: trimmed });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 20 }}>
      {/* -------------------------------------------------------
         🔙 HEADER + SEARCH INPUT
      ------------------------------------------------------- */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.text} />
        </TouchableOpacity>

        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Search users, posts or #tags..."
          style={{
            flex: 1,
            marginLeft: 12,
            backgroundColor: "#f2f2f2",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 16,
          }}
        />
      </View>

      <ScrollView style={{ marginTop: 20 }}>
        {/* -------------------------------------------------------
           🕒 RECENT SEARCHES
        ------------------------------------------------------- */}
        {!trimmed && Array.isArray(recentSearches) && recentSearches.length > 0 && (
          <View>
            <Text
              style={{
                marginLeft: 16,
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              Recent Searches
            </Text>

            {recentSearches?.map((r: any) => (
              <TouchableOpacity
                key={r._id}
                onPress={() => setQuery(r.query)}
                style={{
                  flexDirection: "row",
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Ionicons name="time-outline" size={20} color="#999" />
                <Text style={{ marginLeft: 10, fontSize: 16 }}>
                  {r.query}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* -------------------------------------------------------
           🔥 RECENTLY ADDED POSTS — GRID LAYOUT
        ------------------------------------------------------- */}
        {!trimmed && Array.isArray(recentPosts) && recentPosts.length > 0 && (
          <>
            <Text
              style={{
                marginLeft: 16,
                marginTop: 20,
                marginBottom: 10,
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              Recently Added Posts
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                paddingHorizontal: 10,
              }}
            >
              {recentPosts?.map((post: any) => (
                <TouchableOpacity
                  key={post._id}
                  onPress={() => {
                    saveSearch();
                    router.push(`/post-details?postId=${post._id}`);
                  }}
                  style={{ width: "32%", marginBottom: 10 }}
                >
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={{
                      width: "100%",
                      height: 120,
                      borderRadius: 8,
                      backgroundColor: "#eee",
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* -------------------------------------------------------
           👤 USERS SECTION
        ------------------------------------------------------- */}
        {filteredUsers?.length > 0 && (
          <>
            <Text
              style={{
                marginLeft: 16,
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              Users
            </Text>

            {filteredUsers?.map((u: any) => (
              <TouchableOpacity
                key={u._id}
                onPress={() => {
                  saveSearch();
                  router.push(`/other-profile?userId=${u._id}`);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 14,
                }}
              >
                <Image
                  source={{ uri: u.image }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    marginRight: 12,
                  }}
                />
                <Text style={{ fontSize: 17 }}>{u.fullname}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* -------------------------------------------------------
           📝 POSTS SECTION
        ------------------------------------------------------- */}
        {filteredPosts?.length > 0 && (
          <>
            <Text
              style={{
                marginLeft: 16,
                marginTop: 20,
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              Posts
            </Text>

            {filteredPosts?.map((p: any) => (
              <TouchableOpacity
                key={p._id}
                onPress={() => {
                  saveSearch();
                  router.push(`/post-details?postId=${p._id}`);
                }}
                style={{
                  flexDirection: "row",
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: "#eee",
                    marginRight: 12,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={{ uri: p.imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 16 }}>{p.title ?? "Untitled"}</Text>

                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {p.tags?.slice(0, 3).map((t: string, i: number) => (
                      <Text
                        key={i}
                        style={{ color: COLORS.primary, marginRight: 6 }}
                      >
                        #{t}
                      </Text>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* -------------------------------------------------------
           ❌ NO RESULTS FOUND
        ------------------------------------------------------- */}
        {trimmed &&
          filteredUsers?.length === 0 &&
          filteredPosts?.length === 0 && (
            <Text
              style={{
                textAlign: "center",
                marginTop: 40,
                color: COLORS.textSecondary,
              }}
            >
              No results found
            </Text>
          )}
      </ScrollView>
    </View>
  );
}
