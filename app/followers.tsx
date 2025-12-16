import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export default function FollowersScreen() {
  const router = useRouter();
  const { userId, from } = useLocalSearchParams();

  /* ───────────────────────────────
     🚀 Delay query for smooth nav
  ─────────────────────────────── */
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEnabled(true), 120);
    return () => clearTimeout(t);
  }, []);

  const rawFollowers = useQuery(
    api.users.getFollowers,
    enabled
      ? { userId: userId === "me" ? undefined : (userId as any) }
      : "skip"
  );

  const followers = (rawFollowers ?? []).filter(Boolean);

  const toggleFollow = useMutation(api.users.toggleFollow);
  const startConversation = useMutation(api.chat.getOrStartConversation);

  /* ───────────────────────────────
     ⬅️ Back handling (FAST)
  ─────────────────────────────── */
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (from === "other") {
      router.replace(`/other-profile?userId=${userId}`);
    } else {
      router.replace("/(tabs)/profile");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <AppHeader
        title="Followers"
        showBackButton
        onBackPress={handleBack}
      />

      {/* Empty state */}
      {enabled && followers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No followers yet</Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          keyExtractor={(item) => item!._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: hp(2) }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {/* Avatar */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push(`/other-profile?userId=${item!._id}`)
                }
              >
                <Image
                  source={{
                    uri:
                      item!.image ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={styles.avatar}
                />
              </TouchableOpacity>

              {/* User Info */}
              <TouchableOpacity
                style={styles.userInfo}
                activeOpacity={0.7}
                onPress={() =>
                  router.push(`/other-profile?userId=${item!._id}`)
                }
              >
                <Text numberOfLines={1} style={styles.name}>
                  {item!.fullname}
                </Text>
                <Text numberOfLines={1} style={styles.username}>
                  @{item!.username}
                </Text>
              </TouchableOpacity>

              {/* Message */}
              <TouchableOpacity
                style={styles.msgBtn}
                activeOpacity={0.8}
                onPress={async () => {
                  const conv = await startConversation({
                    otherUserId: item!._id,
                  });
                  if (!conv || !conv._id) return;

                  router.push(
                    `/chat-screen?conversationId=${conv._id}&otherUserId=${item!._id}`
                  );
                }}
              >
                <Text style={styles.msgBtnText}>Message</Text>
              </TouchableOpacity>

              {/* Remove / Unfollow */}
              <TouchableOpacity
                style={styles.removeBtn}
                activeOpacity={0.8}
                onPress={() =>
                  toggleFollow({ followingId: item!._id })
                }
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

/* ───────────────────────────────
   STYLES
─────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  emptyBox: {
    marginTop: hp(15),
    alignItems: "center",
  },
  emptyText: {
    fontSize: wp(4),
    color: COLORS.textSecondary,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderColor: "#f1f1f1",
  },

  avatar: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    marginRight: wp(4),
  },

  userInfo: {
    flex: 1,
    justifyContent: "center",
  },

  name: {
    fontSize: wp(4),
    fontWeight: "700",
    color: COLORS.text,
  },

  username: {
    fontSize: wp(3.4),
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  msgBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.9),
    borderRadius: wp(2),
    marginRight: wp(2),
  },

  msgBtnText: {
    color: "#fff",
    fontSize: wp(3.2),
    fontWeight: "600",
  },

  removeBtn: {
    backgroundColor: "#eee",
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    justifyContent: "center",
    alignItems: "center",
  },

  removeX: {
    fontSize: wp(4.4),
    fontWeight: "700",
    color: "#444",
  },
});
