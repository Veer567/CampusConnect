// app/followers.tsx

import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FollowersScreen() {
  const router = useRouter();
  const { userId, from } = useLocalSearchParams();

  // Fetch followers
  const rawFollowers = useQuery(api.users.getFollowers, {
    userId: userId === "me" ? undefined : (userId as any),
  });

  const followers = (rawFollowers ?? []).filter((u) => u !== null);

  const toggleFollow = useMutation(api.users.toggleFollow);
  const startConversation = useMutation(api.chat.getOrStartConversation);

  /*──────────────────────────────
     SMART BACK HANDLING
  ──────────────────────────────*/
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      const fallback =
        from === "profile"
          ? "/(tabs)/profile"
          : from === "other"
            ? `/other-profile?userId=${userId}`
            : "/(tabs)";
      router.replace(fallback as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <AppHeader
        title="Followers"
        showBackButton={true}
        onBackPress={() => router.push("/(tabs)/profile")}
      />

      {followers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No followers yet</Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {/* Profile Image */}
              <TouchableOpacity
                onPress={() => router.push(`/other-profile?userId=${item._id}`)}
              >
                <Image
                  source={{
                    uri: item.image || "https://i.pravatar.cc/150",
                  }}
                  style={styles.avatar}
                />
              </TouchableOpacity>

              {/* Name + username */}
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => router.push(`/other-profile?userId=${item._id}`)}
              >
                <Text style={styles.name}>{item.fullname}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </TouchableOpacity>

              {/* Message Button */}
              <TouchableOpacity
                style={styles.msgBtn}
                onPress={async () => {
                  const conv = await startConversation({
                    otherUserId: item._id,
                  });
                  if (!conv || !conv._id) {
                    // Conversation wasn't created/found, don't navigate
                    return;
                  }
                  router.push(
                    `/chat-screen?conversationId=${conv._id}&otherUserId=${item._id}`
                  );
                }}
              >
                <Text style={styles.msgBtnText}>Message</Text>
              </TouchableOpacity>

              {/* Remove / Unfollow Button */}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => toggleFollow({ followingId: item._id })}
              >
                <Text style={styles.removeX}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyBox: {
    marginTop: 100,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#f2f2f2",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 999,
    marginRight: 12,
  },
  name: {
    fontWeight: "700",
    fontSize: 15,
    color: COLORS.text,
  },
  username: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  msgBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  msgBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  removeBtn: {
    backgroundColor: "#eee",
    width: 30,
    height: 30,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  removeX: {
    fontSize: 16,
    color: "#444",
    fontWeight: "700",
  },
});
