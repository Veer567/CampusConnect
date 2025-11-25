import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

interface ProfileHeaderProps {
  imageUrl?: string;
  imageCacheBuster: number;
  fullname: string;
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

export function ProfileHeader(props: ProfileHeaderProps) {
  const {
    imageUrl,
    imageCacheBuster,
    fullname,
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

  /* -----------------------------------
     ⭐ GEAR ROTATION ANIMATION
  ----------------------------------- */
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

  return (
    <>
      <StatusBar style="dark" />

      {/* SETTINGS BUTTON (FLOATING) */}
      {isOwner && (
        <Animated.View
          style={[
            styles.settingsFloatingBtn,
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              animateGear();
              setTimeout(() => {
                router.push("/(settings)/SettingsDrawer");
              }, 200); // delay in ms
            }}
            activeOpacity={0.9}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.container}>
        {/* PROFILE IMAGE */}
        <TouchableOpacity
          onPress={openImageCropper}
          disabled={!isOwner}
          activeOpacity={0.8}
        >
          <View style={{ position: "relative" }}>
            <Image
              source={{
                uri: imageUrl
                  ? `${imageUrl}?t=${imageCacheBuster}`
                  : "https://i.pravatar.cc/300",
              }}
              style={[
                styles.avatar,
                {
                  width: imageSize,
                  height: imageSize,
                  borderRadius: imageSize / 2,
                },
              ]}
            />

            {isOwner && (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={wp(4.5)} color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* NAME */}
        {editing ? (
          <TextInput
            value={fullname}
            onChangeText={setFullname}
            style={styles.nameInput}
            placeholder="Full Name"
          />
        ) : (
          <Text style={styles.nameText}>{fullname || "No Name"}</Text>
        )}

        {/* YEAR */}
        {editing ? (
          <TextInput
            value={year}
            onChangeText={setYear}
            placeholder="e.g. 2026"
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

/* ===== STAT COMPONENT ===== */
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

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: wp(4),
  },

  /* Floating Settings Button */
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

export default ProfileHeader;
