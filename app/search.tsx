// app/search.tsx

import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

/* -------------------------------------------------------
   ⭐ INLINE SHIMMER COMPONENT (FOR HEADER + GRID)
------------------------------------------------------- */
function Shimmer({ style }: any) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  return (
    <View style={[style, { overflow: "hidden", backgroundColor: "#e5e5e5" }]}>
      <Animated.View
        style={{
          width: 100,
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.45)",
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}

/* -------------------------------------------------------
   ⭐ FULL PAGE SKELETON LOADING (MIXED STYLE)
------------------------------------------------------- */
function SearchSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={[styles.header, { marginBottom: 4 }]}>
        <View style={[styles.headerRow, { marginBottom: 10 }]}>
          <Shimmer style={{ width: 28, height: 28, borderRadius: 8 }} />
          <Shimmer
            style={{ width: 100, height: 18, borderRadius: 6, marginLeft: 12 }}
          />
        </View>

        <Shimmer
          style={[
            styles.searchInput,
            { height: 48, borderRadius: 10, marginTop: 0 },
          ]}
        />
      </View>

      {/* RECENT SEARCHES SECTION */}
      <View style={styles.section}>
        <Shimmer style={{ width: 150, height: 18, borderRadius: 6 }} />

        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.recentRow}>
            <Shimmer style={{ width: 18, height: 18, borderRadius: 6 }} />
            <Shimmer
              style={{
                height: 16,
                width: 120,
                borderRadius: 6,
                marginLeft: 12,
              }}
            />
          </View>
        ))}
      </View>

      {/* RECENT POSTS GRID */}
      <View style={styles.section}>
        <Shimmer style={{ width: 180, height: 18, borderRadius: 6 }} />

        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer
              key={i}
              style={{
                width: "32%",
                height: wp(30),
                borderRadius: 10,
                marginBottom: 10,
              }}
            />
          ))}
        </View>
      </View>

      {/* USERS LIST */}
      <View style={styles.section}>
        <Shimmer style={{ width: 140, height: 18, borderRadius: 6 }} />

        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.skelUserRow}>
            <Shimmer style={styles.skelAvatar} />
            <Shimmer style={styles.skelUserLine} />
          </View>
        ))}
      </View>

      {/* POSTS LIST */}
      <View style={styles.section}>
        <Shimmer style={{ width: 140, height: 18, borderRadius: 6 }} />

        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.skelPostRow}>
            <Shimmer style={styles.skelThumb} />
            <View style={{ flex: 1 }}>
              <Shimmer style={styles.skelPostLine} />
              <Shimmer style={[styles.skelPostLine, { width: "40%" }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

/* -------------------------------------------------------
   MAIN SEARCH SCREEN
------------------------------------------------------- */
export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const trimmed = debouncedQuery.trim().toLowerCase();

  const { user } = useUser();
  const clerkId = user?.id;

  const me = useQuery(api.users.getUserByClerkId, {
    clerkId: clerkId || "",
  });

  const users = useQuery(api.users.searchUsers, { q: trimmed });
  const posts = useQuery(api.posts.searchPosts, { q: trimmed });
  const recentPosts = useQuery(api.posts.getRecentPosts, { limit: 12 });
  const recentSearches = useQuery(
    api.users.getRecentSearches,
    me ? { userId: me._id } : "skip"
  );

  const saveRecentSearch = useMutation(api.users.saveRecentSearch);

  const isLoading =
    users === undefined ||
    posts === undefined ||
    recentPosts === undefined ||
    recentSearches === undefined;

  const isHashtag = query.startsWith("#");
  const tagLower = query.replace("#", "").toLowerCase();

  /* USERS FILTER */
  const filteredUsers = useMemo(() => {
    if (!trimmed || isHashtag) return [];
    return (
      users?.filter(
        (u: any) =>
          u.clerkId !== clerkId && u.fullname?.toLowerCase().includes(trimmed)
      ) ?? []
    );
  }, [users, trimmed]);

  /* POSTS FILTER */
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
      posts?.filter((p: any) => p.title?.toLowerCase().includes(trimmed)) ?? []
    );
  }, [posts, trimmed]);

  const saveSearch = () => {
    if (me && trimmed.length > 0) {
      saveRecentSearch({ userId: me._id, query: trimmed });
    }
  };

  /* 🚀 SHOW SKELETON */
  if (isLoading) return <SearchSkeleton />;

  /* -------------------------------------------------------
     UI WHEN LOADED
  ------------------------------------------------------- */
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Search</Text>
        </View>

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
        {/* RECENT SEARCHES */}
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

        {/* RECENT POSTS GRID */}
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

        {/* USERS */}
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

        {/* POSTS LIST */}
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
                <Image source={{ uri: p.imageUrl }} style={styles.postThumb} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.postTitle}>{p.title ?? "Untitled"}</Text>

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

        {/* NO RESULTS */}
        {trimmed &&
          filteredUsers.length === 0 &&
          filteredPosts.length === 0 && (
            <Text style={styles.noResults}>No results found</Text>
          )}

        <View style={{ height: 40 }} />
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

  header: {
    paddingHorizontal: wp(4),
    marginBottom: 4, // reduced — lifts everything up
    paddingTop: 4, // slight upward shift
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8, // reduced (was 12)
    marginTop: -10, // moves up slightly
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 14,
  },

  searchInput: {
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "android" ? 10 : 12,
    fontSize: 16,
    color: COLORS.text,
  },

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

  /* Grid */
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

  /* SKELETON STATIC BLOCKS */
  skelUserRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  skelAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  skelUserLine: {
    height: 16,
    width: "40%",
    backgroundColor: "#eee",
    borderRadius: 6,
  },

  skelPostRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  skelThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  skelPostLine: {
    height: 14,
    width: "70%",
    backgroundColor: "#eee",
    borderRadius: 6,
    marginBottom: 6,
  },
});
