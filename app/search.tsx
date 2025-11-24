// app/search.tsx

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/themes";

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

/* -------------------------------------------------------
   🔄 Debounce Hook
------------------------------------------------------- */
function useDebounce(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value]);
  return debounced;
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  const debouncedQuery = useDebounce(query, 300);
  const trimmed = debouncedQuery.trim().toLowerCase();

  const { user } = useUser();
  const clerkId = user?.id;

  const me = useQuery(api.users.getUserByClerkId, {
    clerkId: clerkId || "",
  });

  // Queries
  const users = useQuery(api.users.searchUsers, { q: trimmed });
  const posts = useQuery(api.posts.searchPosts, { q: trimmed });
  const recentPosts = useQuery(api.posts.getRecentPosts, { limit: 12 });
  const recentSearches = useQuery(
    api.users.getRecentSearches,
    me ? { userId: me._id } : "skip"
  );

  const saveRecentSearch = useMutation(api.users.saveRecentSearch);

  const isHashtag = query.startsWith("#");
  const tagLower = query.replace("#", "").toLowerCase();

  /* -------------------------------------------------------
     👤 Filter Users
  ------------------------------------------------------- */
  const filteredUsers = useMemo(() => {
    if (!trimmed || isHashtag) return [];
    return (
      users?.filter(
        (u: any) =>
          u.clerkId !== clerkId &&
          u.fullname?.toLowerCase().includes(trimmed)
      ) ?? []
    );
  }, [users, trimmed]);

  /* -------------------------------------------------------
     📝 Filter Posts
  ------------------------------------------------------- */
  const filteredPosts = useMemo(() => {
    if (!trimmed) return [];
    if (isHashtag) {
      return (
        posts?.filter((p: any) =>
          p.tags?.some((t: string) => t.toLowerCase().startsWith(tagLower))
        ) ?? []
      );
    }
    return (
      posts?.filter((p: any) =>
        p.title?.toLowerCase().includes(trimmed)
      ) ?? []
    );
  }, [posts, trimmed]);

  const saveSearch = () => {
    if (me && trimmed.length > 0) {
      saveRecentSearch({ userId: me._id, query: trimmed });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* -------------------------------------------------------
           HEADER + SEARCH BAR
      ------------------------------------------------------- */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.text} />
        </TouchableOpacity>

        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Search users, posts or #tags..."
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* -------------------------------------------------------
           🕒 RECENT SEARCHES
        ------------------------------------------------------- */}
        {!trimmed &&
          Array.isArray(recentSearches) &&
          recentSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>

              {recentSearches.map((r: any) => (
                <TouchableOpacity
                  key={r._id}
                  onPress={() => setQuery(r.query)}
                  style={styles.recentRow}
                >
                  <Ionicons name="time-outline" size={19} color="#999" />
                  <Text style={styles.recentText}>{r.query}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

        {/* -------------------------------------------------------
           🔥 RECENT POSTS GRID
        ------------------------------------------------------- */}
        {!trimmed && Array.isArray(recentPosts) && recentPosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Added Posts</Text>

            <View style={styles.grid}>
              {recentPosts.map((post: any) => (
                <TouchableOpacity
                  key={post._id}
                  onPress={() => {
                    saveSearch();
                    router.push(`/post-details?postId=${post._id}`);
                  }}
                  style={styles.gridItem}
                >
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={styles.gridImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* -------------------------------------------------------
           👤 USERS
        ------------------------------------------------------- */}
        {filteredUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Users</Text>

            {filteredUsers.map((u: any) => (
              <TouchableOpacity
                key={u._id}
                style={styles.userRow}
                onPress={() => {
                  saveSearch();
                  router.push(`/other-profile?userId=${u._id}`);
                }}
              >
                <Image source={{ uri: u.image }} style={styles.userAvatar} />
                <Text style={styles.userName}>{u.fullname}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* -------------------------------------------------------
           📝 POSTS
        ------------------------------------------------------- */}
        {filteredPosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posts</Text>

            {filteredPosts.map((p: any) => (
              <TouchableOpacity
                key={p._id}
                style={styles.postRow}
                onPress={() => {
                  saveSearch();
                  router.push(`/post-details?postId=${p._id}`);
                }}
              >
                <Image
                  source={{ uri: p.imageUrl }}
                  style={styles.postThumb}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.postTitle}>
                    {p.title ?? "Untitled"}
                  </Text>

                  <View style={styles.tagRow}>
                    {p.tags?.slice(0, 3).map((t: string, i: number) => (
                      <Text key={i} style={styles.tag}>
                        #{t}
                      </Text>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* -------------------------------------------------------
           ❌ NO RESULTS
        ------------------------------------------------------- */}
        {trimmed &&
          filteredUsers.length === 0 &&
          filteredPosts.length === 0 && (
            <Text style={styles.noResults}>No results found</Text>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}

/*────────────────────────────────────────
 ⬇️ UPDATED RESPONSIVE STYLES
────────────────────────────────────────*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* Header + Search Bar */
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingTop: Platform.OS === "ios" ? 8 : 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "android" ? 10 : 12,
    fontSize: 16,
    color: COLORS.text,
  },

  /* Sections */
  section: {
    marginTop: 20,
    paddingHorizontal: wp(4),
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 10,
  },

  /* Recent searches */
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  recentText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },

  /* Grid (recent posts) */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "32%",
    marginBottom: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: wp(30),
    borderRadius: 10,
    backgroundColor: "#eee",
  },

  /* User Rows */
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userName: { fontSize: 17, color: COLORS.text },

  /* Post Rows */
  postRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  postThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  postTitle: { fontSize: 16, fontWeight: "600" },
  tagRow: { flexDirection: "row", marginTop: 3 },
  tag: { color: COLORS.primary, marginRight: 6 },

  noResults: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.textSecondary,
    fontSize: 15,
  },
});
