// app/following.tsx

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

export default function FollowingScreen() {
  const router = useRouter();
  const { userId, from } = useLocalSearchParams();

  // FOLLOWING LIST
  const rawFollowing = useQuery(api.users.getFollowing, {
    userId: userId === "me" ? undefined : (userId as any),
  });

  const following = (rawFollowing ?? []).filter((u) => u !== null);

  const toggleFollow = useMutation(api.users.toggleFollow);
  const startConversation = useMutation(api.chat.getOrStartConversation);

  // ⭐ SMART BACK HANDLER
  const handleBack = () => {
    if (from === "profile") {
      router.push("/(tabs)/profile");
    } else if (from === "other") {
      router.push(`/other-profile?userId=${userId}`);
    } else {
      router.back();
    }
  };

  // AppHeader's props type doesn't include onBack in the current declaration;
  // use a local any-cast so we can pass the handler without a type error.
  const AppHeaderAny = AppHeader as any;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <AppHeader
        title="Following"
        showBackButton={true}
        onBackPress={() => router.push("/(tabs)/profile")}
      />

      {following.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Not following anyone</Text>
        </View>
      ) : (
        <FlatList
          data={following}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {/* Profile Image */}
              <TouchableOpacity
                onPress={() => router.push(`/other-profile?userId=${item._id}`)}
              >
                <Image
                  source={{ uri: item.image || "https://i.pravatar.cc/150" }}
                  style={styles.avatar}
                />
              </TouchableOpacity>

              {/* Name + Username */}
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
                    // conversation couldn't be created/fetched; abort navigation
                    return;
                  }
                  router.push(
                    `/chat-screen?conversationId=${conv._id}&otherUserId=${item._id}`
                  );
                }}
              >
                <Text style={styles.msgBtnText}>Message</Text>
              </TouchableOpacity>

              {/* Unfollow Button */}
              <TouchableOpacity
                style={styles.unfollowBtn}
                onPress={() => toggleFollow({ followingId: item._id })}
              >
                <Text style={styles.unfollowX}>✕</Text>
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
  unfollowBtn: {
    backgroundColor: "#eee",
    width: 30,
    height: 30,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  unfollowX: {
    fontSize: 16,
    color: "#444",
    fontWeight: "700",
  },
});
