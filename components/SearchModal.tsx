import { COLORS } from "@/constants/themes";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// -----------------------------
//   TYPES
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
//   COMPONENT
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

  // --------------------------
  // FILTER LOGIC
  // --------------------------
  const trimmed = query.trim();
  const isHashtag = trimmed.startsWith("#");

  const qLower = trimmed.toLowerCase();
  const tagLower = trimmed.replace("#", "").toLowerCase();

  // ---------------- USERS (ONLY when not searching tags) ----------------
  const filteredUsers =
    trimmed.length > 0 && !isHashtag
      ? results.users.filter(
          (u) =>
            u.clerkId !== loggedInClerkId &&
            u.fullname.toLowerCase().includes(qLower)
        )
      : [];

  // ---------------- POSTS ----------------
  let filteredPosts: SearchPost[] = [];

  if (trimmed.length > 0) {
    if (isHashtag) {
      // STRICT TAG SEARCH
      filteredPosts = results.posts.filter((p) =>
        p.tags?.some((tag) =>
          tag.toLowerCase().startsWith(tagLower)
        )
      );
    } else {
      // TITLE SEARCH ONLY
      filteredPosts = results.posts.filter((p) =>
        p.title.toLowerCase().includes(qLower)
      );
    }
  }

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            maxHeight: "80%",
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              autoFocus
              placeholder="Search users, posts, or #tags..."
              value={query}
              onChangeText={setQuery}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 12,
                fontSize: 16,
              }}
            />
            <TouchableOpacity onPress={onClose} style={{ marginLeft: 10 }}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Results */}
          <ScrollView style={{ marginTop: 16 }}>
            {/* USERS */}
            {filteredUsers.length > 0 && (
              <>
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 8,
                  }}
                >
                  Users
                </Text>

                {filteredUsers.map((u) => (
                  <TouchableOpacity
                    key={u._id}
                    onPress={() => {
                      if (u.clerkId === loggedInClerkId) {
                        onClose();
                        return router.push("/profile");
                      }
                      onUserPress(u);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                    }}
                  >
                    <Image
                      source={{ uri: u.image || "https://i.pravatar.cc/100" }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 12,
                      }}
                    />
                    <Text style={{ fontSize: 16 }}>{u.fullname}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* POSTS */}
            {filteredPosts.length > 0 && (
              <>
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  Posts
                </Text>

                {filteredPosts.map((p) => (
                  <TouchableOpacity
                    key={p._id}
                    onPress={() => {
                      onPostPress(p);
                      onClose();
                    }}
                    style={{
                      paddingVertical: 10,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: "#eee",
                        overflow: "hidden",
                        marginRight: 12,
                      }}
                    >
                      <Image
                        source={{ uri: p.imageUrl }}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16 }}>{p.title}</Text>

                      {/* TAGS */}
                      {p.tags && p.tags.length > 0 && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                          {p.tags.slice(0, 3).map((t, i) => (
                            <Text
                              key={i}
                              style={{
                                fontSize: 12,
                                color: COLORS.primary,
                                marginRight: 6,
                              }}
                            >
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
                <Text style={{ textAlign: "center", marginTop: 20 }}>
                  No results found
                </Text>
              )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
