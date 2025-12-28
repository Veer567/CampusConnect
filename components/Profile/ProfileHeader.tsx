import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import { Image } from "expo-image";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

/* ---------------- PROPS ---------------- */

interface ProfileHeaderProps {
  imageUrl?: string;
  imageCacheBuster: number;

  fullname?: string; // editable, optional
  username: string; // ✅ ALWAYS present (default display)

  year: string;
  editing: boolean;

  setFullname: (v: string) => void;
  setYear: (v: string) => void;
  openImageCropper: () => void;

  isOwner: boolean;
  posts: number;
  followers: number;
  following: number;
  userId: string;
}

/* ---------------- COMPONENT ---------------- */

export function ProfileHeader(props: ProfileHeaderProps) {
  const {
    imageUrl,
    imageCacheBuster,
    fullname,
    username,
    year,
    editing,
    setFullname,
    setYear,
    openImageCropper,
    isOwner,
    posts,
    followers,
    following,
    userId,
  } = props;

  const router = useRouter();
  const imageSize = wp(32);

  /* ---------------- SETTINGS ICON ANIMATION ---------------- */

  const rotation = useRef(new Animated.Value(0)).current;

  const animateGear = () => {
    Animated.sequence([
      Animated.timing(rotation, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const finalImageUrl = imageUrl
    ? imageCacheBuster
      ? `${imageUrl}?v=${imageCacheBuster}` // only changes after upload
      : imageUrl
    : "https://i.pravatar.cc/300";

  /* ---------------- RENDER ---------------- */

  return (
    <>
      <StatusBar style="dark" />

      {/* SETTINGS BUTTON */}
      {isOwner && (
        <Animated.View
          style={[
            styles.settingsFloatingBtn,
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          <Pressable
            onPress={() => {
              animateGear();
              setTimeout(() => {
                router.push("/(settings)/SettingsDrawer");
              }, 200);
            }}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={COLORS.primary}
            />
          </Pressable>
        </Animated.View>
      )}

      <View style={styles.container}>
        {/* PROFILE IMAGE */}
        <Pressable onPress={openImageCropper} disabled={!isOwner}>
          <View style={{ position: "relative" }}>
            <Image
              source={{ uri: finalImageUrl }}
              style={[
                styles.avatar,
                {
                  width: imageSize,
                  height: imageSize,
                  borderRadius: imageSize / 2,
                },
              ]}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
            />

            {isOwner && (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={wp(4.5)} color="#fff" />
              </View>
            )}
          </View>
        </Pressable>

        {/* NAME (USERNAME fallback) */}
        {editing ? (
          <TextInput
            value={fullname}
            onChangeText={setFullname}
            style={styles.nameInput}
            placeholder="Full Name"
            placeholderTextColor={COLORS.textSecondary}
          />
        ) : (
          <Text style={styles.nameText}>
            {fullname?.trim() ? fullname : username}
          </Text>
        )}

        {/* YEAR */}
        {editing ? (
          <TextInput
            value={year}
            onChangeText={setYear}
            placeholder="e.g. 2"
            placeholderTextColor={COLORS.grey}
            style={styles.yearInput}
          />
        ) : (
          <View style={styles.yearBadge}>
            <Text style={styles.yearBadgeText}>Year: {year || "—"}</Text>
          </View>
        )}

        {/* STATS */}
        <View style={styles.statsRow}>
          <Stat
            label="Followers"
            value={followers}
            onPress={() =>
              router.push({
                pathname: "/followers",
                params: { userId, from: "profile" },
              })
            }
          />

          <Stat
            label="Following"
            value={following}
            onPress={() =>
              router.push({
                pathname: "/following",
                params: { userId, from: "profile" },
              })
            }
          />

          <Stat
            label="Posts"
            value={posts}
            onPress={() =>
              router.push({
                pathname: "/user-posts",
                params: { userId, from: "profile" },
              })
            }
          />
        </View>
      </View>
    </>
  );
}

/* ---------------- STAT COMPONENT ---------------- */

function Stat({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: wp(4),
  },

  settingsFloatingBtn: {
    position: "absolute",
    top: hp(1.2),
    right: wp(4),
    backgroundColor: "#ffffff",
    padding: wp(2.2),
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },

  avatar: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },

  cameraBadge: {
    position: "absolute",
    bottom: hp(0.8),
    right: -hp(0.8),
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: wp(2.2),
    elevation: 3,
  },

  nameText: {
    marginTop: hp(1.2),
    fontSize: wp(6),
    fontWeight: "700",
    color: COLORS.primary,
  },

  nameInput: {
    marginTop: hp(1.2),
    fontSize: wp(5),
    fontWeight: "700",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 12,
    backgroundColor: "#f0f7ff",
    textAlign: "center",
    width: wp(70),
    color: COLORS.primary,
  },

  yearInput: {
    marginTop: hp(1),
    backgroundColor: "#f0f7ff",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 12,
    fontSize: wp(4),
    fontWeight: "600",
    color: COLORS.primary,
    width: wp(40),
    textAlign: "center",
  },

  yearBadge: {
    marginTop: hp(1),
    backgroundColor: COLORS.secondary,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    borderRadius: 20,
  },

  yearBadgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: wp(4),
  },

  statsRow: {
    flexDirection: "row",
    gap: wp(12),
    marginTop: hp(2.2),
    marginLeft: -wp(3.5),
  },

  statValue: {
    fontSize: wp(5),
    fontWeight: "700",
    textAlign: "center",
  },

  statLabel: {
    fontSize: wp(3.3),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: hp(0.4),
  },
});
export default React.memo(ProfileHeader);
