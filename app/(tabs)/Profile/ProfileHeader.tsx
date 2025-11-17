// components/profile/ProfileHeader.tsx
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { useWindowDimensions } from "react-native";

export function ProfileHeader({
  imageUrl, fullname, year, editing, setFullname, setYear,
  pickAndCropImage, stats, isOwner
}: any) {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width, height) * 0.28;

  return (
    <View style={{ alignItems: "center", marginTop: 12 }}>
      <TouchableOpacity onPress={pickAndCropImage} activeOpacity={isOwner ? 0.8 : 1}>
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: imageUrl || "https://i.pravatar.cc/300" }}
            style={{
              width: size, height: size, borderRadius: size / 2,
              borderWidth: 4, borderColor: COLORS.primary,
            }}
            resizeMode="cover"
          />
          {isOwner && (
            <View style={{
              position: "absolute", bottom: 6, right: -6,
              backgroundColor: COLORS.primary, borderRadius: 18, padding: 6,
            }}>
              <Ionicons name="create-outline" size={16} color="#fff" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {editing ? (
        <TextInput
          value={fullname}
          onChangeText={setFullname}
          style={{ marginTop: 10, fontWeight: "700", color: COLORS.primary, backgroundColor: "#f8fbff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, fontSize: size * 0.2 }}
        />
      ) : (
        <Text style={{ marginTop: 10, fontWeight: "700", color: COLORS.primary, fontSize: size * 0.2 }}>
          {fullname || "—"}
        </Text>
      )}

      {editing ? (
        <TextInput
          value={year}
          onChangeText={setYear}
          style={{ marginTop: 8, backgroundColor: "#f8fbff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, color: COLORS.primary, fontWeight: "600", fontSize: size * 0.12 }}
        />
      ) : (
        <View style={{ backgroundColor: COLORS.secondary, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 14, marginTop: 8 }}>
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: size * 0.12 }}>
            {year || "Year —"}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 18, width: "100%" }}>
        {[
          { label: "Posts", value: stats?.posts ?? 0 },
          { label: "Likes", value: stats?.likes ?? 0 },
          { label: "Bookmarks", value: stats?.bookmarks ?? 0 },
        ].map((s, i) => (
          <View key={i} style={{ alignItems: "center" }}>
            <Text style={{ color: COLORS.primary, fontWeight: "800", fontSize: size * 0.16 }}>{s.value}</Text>
            <Text style={{ color: COLORS.grey, fontSize: size * 0.11 }}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}