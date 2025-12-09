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

/* -------------------------------------------------------
   SIMPLE SHIMMER (INLINE)
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
    outputRange: [-200, 200],
  });

  return (
    <View style={[style, { backgroundColor: "#e3e3e3", overflow: "hidden" }]}>
      <Animated.View
        style={{
          width: "40%",
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.5)",
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}

/* -------------------------------------------------------
   SIMPLE SKELETON LOADING
------------------------------------------------------- */
function SimpleSearchSkeleton() {
  return (
    <View style={{ padding: 16 }}>
      {/* Search bar */}
      <Shimmer style={{ width: "100%", height: 45, borderRadius: 10 }} />

      <View style={{ height: 20 }} />

      {/* List rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
        >
          {/* avatar */}
          <Shimmer
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              marginRight: 14,
            }}
          />

          {/* name + subtitle */}
          <View style={{ flex: 1 }}>
            <Shimmer
              style={{
                width: "70%",
                height: 14,
                borderRadius: 6,
                marginBottom: 10,
              }}
            />
            <Shimmer style={{ width: "40%", height: 14, borderRadius: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/* -------------------------------------------------------
   DEBOUNCE HOOK
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
   MAIN SCREEN
------------------------------------------------------- */
export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const trimmed = debouncedQuery.trim().toLowerCase();

  const { user } = useUser();
  const clerkId = user?.id;

  // queries
  const me = useQuery(api.users.getUserByClerkId, { clerkId: clerkId || "" });
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

  /* SHOW SIMPLE SKELETON WHILE LOADING */
  if (isLoading) return <SimpleSearchSkeleton />;

  /* ----------------------------------------
       MAIN UI
  ---------------------------------------- */
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

        {/* POSTS */}
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

/* -------------------------------------------------------
   STYLES
------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" , },

  header: { paddingHorizontal: 16, marginBottom: 4, paddingTop: 4 , marginTop: Platform.OS === "android" ? -25 : 0},
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },

  headerTitle: { fontSize: 22, fontWeight: "700", marginLeft: 14 },

  searchInput: {
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "android" ? 10 : 12,
    fontSize: 16,
    color: COLORS.text,
  },

  section: { marginTop: 20, paddingHorizontal: 16 },

  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 10,
  },

  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  recentText: { marginLeft: 10, fontSize: 16 },

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
  userName: { fontSize: 17 },

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
    fontSize: 15,
    color: "#777",
  },
});
