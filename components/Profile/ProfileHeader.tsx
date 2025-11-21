// components/profile/ProfileHeader.tsx
import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Image,
 
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

interface ProfileHeaderProps {
  imageUrl?: string;
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

export function ProfileHeader({
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
}: ProfileHeaderProps & { imageCacheBuster: number }) {
  const { width } = useWindowDimensions();
  const size = width * 0.32;
  const router = useRouter();

  return (
    <>
      <StatusBar style="dark" />

      <View style={{ alignItems: "center" }}>
        {/* Avatar */}
        <TouchableOpacity
          onPress={openImageCropper}
          activeOpacity={isOwner ? 0.7 : 1}
          disabled={!isOwner}
        >
          <View style={{ position: "relative" }}>
            <Image
              source={{
                uri: imageUrl
                  ? `${imageUrl}?t=${imageCacheBuster}`
                  : "https://i.pravatar.cc/300",
              }}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 4,
                borderColor: COLORS.primary,
              }}
            />
            {isOwner && (
              <View
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: -6,
                  backgroundColor: COLORS.primary,
                  borderRadius: 20,
                  padding: 7,
                }}
              >
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Name */}
        {editing ? (
          <TextInput
            value={fullname}
            onChangeText={setFullname}
            style={{
              marginTop: 12,
              fontSize: 24,
              fontWeight: "700",
              color: COLORS.primary,
              backgroundColor: "#f0f7ff",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              minWidth: 200,
              textAlign: "center",
            }}
          />
        ) : (
          <Text style={{ marginTop: 12, fontSize: 24, fontWeight: "700", color: COLORS.primary }}>
            {fullname || "No Name"}
          </Text>
        )}

        {/* Year */}
        {editing ? (
          <TextInput
            value={year}
            onChangeText={setYear}
            placeholder="e.g. 2026"
            style={{
              marginTop: 8,
              backgroundColor: "#f0f7ff",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              fontWeight: "600",
              color: COLORS.primary,
            }}
          />
        ) : (
          <View
            style={{
              marginTop: 8,
              backgroundColor: COLORS.secondary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Year: {year || "—"}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 42, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/followers",
                params: { userId, from: "profile" },
              })
            }
          >
            <Text style={{ fontSize: 19, fontWeight: "700", textAlign: "center" }}>
              {followers}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Followers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/following",
                params: { userId, from: "profile" },
              })
            }
          >
            <Text style={{ fontSize: 19, fontWeight: "700", textAlign: "center" }}>
              {following}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Following</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/user-posts",
                params: { userId, from: "profile" },
              })
            }
          >
            <Text style={{ fontSize: 19, fontWeight: "700", textAlign: "center" }}>
              {posts}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Posts</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}