// --------------------
// BEAUTIFUL NEW SEARCH UI
// --------------------

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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

/* -------------------------------------------------------
   SHIMMER (same as before)
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
   USER SKELETON (Better looking)
------------------------------------------------------- */
function UserSkeletonList() {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 22 }}>
          <Shimmer style={{ width: 55, height: 55, borderRadius: 28 }} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Shimmer style={{ height: 16, width: "50%", borderRadius: 6 }} />
            <View style={{ height: 10 }} />
            <Shimmer style={{ height: 12, width: "35%", borderRadius: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/* -------------------------------------------------------
   POST SKELETON (Card Look)
------------------------------------------------------- */
function PostSkeletonList() {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <Shimmer style={{ width: 60, height: 60, borderRadius: 8 }} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Shimmer style={{ height: 15, width: "70%", borderRadius: 6 }} />
            <View style={{ height: 8 }} />
            <Shimmer style={{ height: 12, width: "50%", borderRadius: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/* -------------------------------------------------------
   DEBOUNCE
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
   MAIN UI
------------------------------------------------------- */
export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const trimmed = debouncedQuery.trim().toLowerCase();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { user } = useUser();
  const clerkId = user?.id;

  const me = useQuery(api.users.getUserByClerkId, { clerkId: clerkId || "" });
  const users = useQuery(api.users.searchUsers, { q: trimmed });
  const posts = useQuery(api.posts.searchPosts, { q: trimmed });
  const recentSearches = useQuery(
    api.users.getRecentSearches,
    me ? { userId: me._id } : "skip"
  );

  const saveRecentSearch = useMutation(api.users.saveRecentSearch);

  const showUserShimmer = users === undefined && trimmed.length > 0;
  const showPostShimmer = posts === undefined && trimmed.length > 0;

  /* Fade animation */
  useEffect(() => {
    const loaded = users !== undefined && posts !== undefined;

    Animated.timing(fadeAnim, {
      toValue: loaded ? 1 : 0,
      duration: loaded ? 220 : 0,
      useNativeDriver: true,
    }).start();
  }, [users, posts]);

  /* Filter Logic */
  const isHashtag = query.startsWith("#");
  const tagLower = query.replace("#", "").toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!trimmed || isHashtag) return [];
    return (
      users?.filter(
        (u: any) =>
          u.clerkId !== clerkId && u.fullname?.toLowerCase().includes(trimmed)
      ) ?? []
    );
  }, [users, trimmed]);

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

  /* -------------------------------------------------------
       COMPONENT UI
  ------------------------------------------------------- */
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
     {/* HEADER */}
<View style={styles.header}>
  <View style={styles.headerRowSide}>
    <Pressable onPress={() => router.back()} style={{ marginRight: 6 }}>
      <Ionicons name="arrow-back" size={26} color={COLORS.text} />
    </Pressable>

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
                <Pressable
                  key={r._id}
                  onPress={() => setQuery(r.query)}
                  style={styles.recentRow}
                >
                  <Ionicons name="time-outline" size={19} color="#999" />
                  <Text style={styles.recentText}>{r.query}</Text>
                </Pressable>
              ))}
            </View>
          )}

        {/* USERS SECTION */}
        {trimmed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Users</Text>

            {showUserShimmer ? (
              <UserSkeletonList />
            ) : (
              <Animated.View style={{ opacity: fadeAnim }}>
                {filteredUsers.map((u: any) => (
                  <Pressable
                    key={u._id}
                    style={styles.userCard}
                    android_ripple={{ color: "#ddd" }}
                    onPress={() => {
                      saveSearch();
                      router.push(`/other-profile?userId=${u._id}`);
                    }}
                  >
                    <Image
                      source={{ uri: u.image }}
                      style={styles.userAvatar}
                    />

                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{u.fullname}</Text>
                      <Text style={styles.userHint}>Tap to view profile</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </Pressable>
                ))}
              </Animated.View>
            )}
          </View>
        )}

        {/* POSTS SECTION */}

        {trimmed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posts</Text>

            {showPostShimmer ? (
              <PostSkeletonList />
            ) : (
              <Animated.View style={{ opacity: fadeAnim }}>
                {filteredPosts.map((p: any) => (
                  <Pressable
                    key={p._id}
                    style={styles.postCard}
                    android_ripple={{ color: "#eaeaea" }}
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
                      <Text style={styles.postTitle}>{p.title}</Text>

                      <View style={styles.tagRow}>
                        {p.tags?.slice(0, 3).map((t: string, i: number) => (
                          <Text key={i} style={styles.tag}>
                            #{t}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </Animated.View>
            )}
          </View>
        )}

        {/* NO RESULTS */}
        {trimmed &&
          !showUserShimmer &&
          !showPostShimmer &&
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
   STYLES (modern clean)
------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 16,

    marginTop: Platform.OS === "android" ? -30 : 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },

  searchInput: {
    width: "100%",
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 6,
  },

  section: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 17,
    marginBottom: 12,
  },

  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  recentText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#555",
  },

  /* USERS */
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userAvatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    marginRight: 12,
  },
  userName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },
  userHint: {
    fontSize: 12,
    color: "#888",
  },

  /* POSTS */
  postCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  postThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  tagRow: {
    flexDirection: "row",
    marginTop: 4,
    flexWrap: "wrap",
  },
  tag: {
    color: COLORS.primary,
    marginRight: 8,
    fontSize: 13,
  },

  noResults: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
    color: "#777",
  },
  headerRowSide: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 5,
},

});
