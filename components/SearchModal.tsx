import { COLORS } from "@/constants/themes";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

// -----------------------------
// TYPES
// -----------------------------
export interface SearchUser {
  _id: Id<"users">;
  fullname: string;
  image?: string;
  clerkId?: string;
}

export interface SearchPost {
  _id: Id<"posts">;
  title: string;
  imageUrl?: string;
  tags?: string[];
}

interface SearchResults {
  users: SearchUser[];
  posts: SearchPost[];
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  query: string;
  setQuery: (v: string) => void;
  results: SearchResults;
  onUserPress: (user: SearchUser) => void;
  onPostPress: (post: SearchPost) => void;
}

// -----------------------------
// Debounce Hook
// -----------------------------
function useDebounce(value: string, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value]);
  return debounced;
}

// -----------------------------
// COMPONENT
// -----------------------------
export default function SearchModal({
  visible,
  onClose,
  query,
  setQuery,
  results,
  onUserPress,
  onPostPress,
}: SearchModalProps) {
  const { user } = useUser();
  const loggedInClerkId = user?.id;

  const debouncedQuery = useDebounce(query);
  const scrollRef = useRef<ScrollView>(null);

  const trimmed = debouncedQuery.trim();
  const isHashtag = trimmed.startsWith("#");

  // -----------------------------
  // AUTO SCROLL UNDER SEARCH BAR
  // -----------------------------
  useEffect(() => {
    if (trimmed.length > 0) {
      scrollRef.current?.scrollTo({ y: 80, animated: true });
    }
  }, [trimmed]);

  // -----------------------------
  // FILTER USERS (MEMOIZED)
  // -----------------------------
  const filteredUsers = useMemo(() => {
    if (trimmed.length === 0 || isHashtag) return [];

    const qLower = trimmed.toLowerCase();

    return results.users.filter(
      (u) =>
        u.clerkId !== loggedInClerkId &&
        u.fullname.toLowerCase().includes(qLower)
    );
  }, [trimmed, isHashtag, results.users]);

  // -----------------------------
  // FILTER POSTS (MEMOIZED)
  // -----------------------------
  const filteredPosts = useMemo(() => {
    if (trimmed.length === 0) return [];

    if (isHashtag) {
      const tagLower = trimmed.replace("#", "").toLowerCase();
      return results.posts.filter((p) =>
        p.tags?.some((tag) => tag.toLowerCase().startsWith(tagLower))
      );
    }

    const qLower = trimmed.toLowerCase();
    return results.posts.filter((p) =>
      p.title.toLowerCase().includes(qLower)
    );
  }, [trimmed, isHashtag, results.posts]);

  // -----------------------------
  // HANDLERS (MEMOIZED)
  // -----------------------------
  const handleUserPress = useCallback(
    (u: SearchUser) => {
      onUserPress(u);
      onClose();
    },
    [onUserPress, onClose]
  );

  const handlePostPress = useCallback(
    (p: SearchPost) => {
      onPostPress(p);
      onClose();
    },
    [onPostPress, onClose]
  );

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />

            <TextInput
              autoFocus
              placeholder="Search users, posts or #tags..."
              placeholderTextColor="#888"
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView ref={scrollRef} style={{ marginTop: 16 }}>
            {/* USERS */}
            {filteredUsers.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Users</Text>

                {filteredUsers.map((u) => (
                  <TouchableOpacity
                    key={u._id}
                    onPress={() => handleUserPress(u)}
                    style={styles.userRow}
                  >
                    <Image
                      source={{ uri: u.image || "https://i.pravatar.cc/100" }}
                      style={styles.avatar}
                    />
                    <Text style={styles.userName}>{u.fullname}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* POSTS */}
            {filteredPosts.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                  Posts
                </Text>

                {filteredPosts.map((p) => (
                  <TouchableOpacity
                    key={p._id}
                    onPress={() => handlePostPress(p)}
                    style={styles.postRow}
                  >
                    <View style={styles.postThumb}>
                      <Image
                        source={{ uri: p.imageUrl }}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.postTitle}>{p.title}</Text>

                      {(p.tags?.length ?? 0) > 0 && (
                        <View style={styles.tagsRow}>
                          {p.tags!.slice(0, 3).map((t, i) => (
                            <Text key={i} style={styles.tag}>
                              #{t}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* NO RESULTS */}
            {trimmed.length > 1 &&
              filteredUsers.length === 0 &&
              filteredPosts.length === 0 && (
                <Text style={styles.noResults}>No results found</Text>
              )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// -----------------------------
// STYLES (Static → Prevent Re-renders)
// -----------------------------
const styles =  StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    maxHeight: "80%",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#000",
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 8,
    color: "#333",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    color: "#111",
  },
  postRow: {
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  postThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#eee",
    overflow: "hidden",
    marginRight: 12,
  },
  postTitle: {
    fontSize: 16,
    color: "#111",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    fontSize: 12,
    color: COLORS.primary,
    marginRight: 6,
    marginTop: 2,
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
    fontSize: 15,
  },
});
