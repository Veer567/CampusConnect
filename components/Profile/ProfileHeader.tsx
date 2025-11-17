// components/profile/ProfileHeader.tsx
import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
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
}: ProfileHeaderProps & { imageCacheBuster: number }) {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width, height) * 0.28;

  return (
    <>
      <StatusBar style="dark"  backgroundColor="#fff"  />

      <View style={{ alignItems: "center",}}>
        {/* --- Avatar --- */}
        <TouchableOpacity
          onPress={openImageCropper}
          activeOpacity={isOwner ? 0.8 : 1}
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
              resizeMode="cover"
            />
            {isOwner && (
              <View
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: -6,
                  backgroundColor: COLORS.primary,
                  borderRadius: 18,
                  padding: 6,
                }}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* --- Name --- */}
        {editing ? (
          <TextInput
            value={fullname}
            onChangeText={setFullname}
            style={{
              marginTop: 10,
              fontWeight: "700",
              color: COLORS.primary,
              backgroundColor: "#f8fbff",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              fontSize: size * 0.2,
            }}
          />
        ) : (
          <Text
            style={{
              marginTop: 10,
              fontWeight: "700",
              color: COLORS.primary,
              fontSize: size * 0.2,
            }}
          >
            {fullname || "—"}
          </Text>
        )}

        {/* --- Year Badge --- */}
        {editing ? (
          <TextInput
            value={year}
            onChangeText={setYear}
            style={{
              marginTop: 8,
              backgroundColor: "#f8fbff",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              color: COLORS.primary,
              fontWeight: "600",
              fontSize: size * 0.12,
            }}
          />
        ) : (
          <View
            style={{
              backgroundColor: COLORS.secondary,
              borderRadius: 18,
              paddingVertical: 6,
              paddingHorizontal: 14,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "600",
                fontSize: size * 0.12,
              }}
            >
              Year: {year || "Year —"}
            </Text>
          </View>
        )}

        {/* ⭐ --- Followers + Following Row --- */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 14,
            gap: 40,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text
              style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}
            >
              {followers}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Followers
            </Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}
            >
              {following}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Following
            </Text>
          </View>
          {/* Posts */}
          <View style={{ alignItems: "center" }}>
            <Text
              style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}
            >
              {posts}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Posts
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}
