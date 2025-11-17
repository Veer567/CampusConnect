// components/profile/ActivityStatsCard.tsx
import { View, Text } from "react-native";
import { COLORS } from "@/constants/themes";

// components/profile/ActivityStatsCard.tsx

export function ActivityStatsCard({ 
  stats 
}: { 
  stats?: {  likes?: number; bookmarks?: number } 
}) {

  const likes = stats?.likes ?? 0;
  const bookmarks = stats?.bookmarks ?? 0;

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
        Activity Stats
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
        {[
  
          { label: "Likes", value: likes },
          { label: "Bookmarks", value: bookmarks },
        ].map((item, i) => (
          <View
            key={i}
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              width: "31%",
              paddingVertical: 16,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.04,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: "800" }}>
              {item.value}
            </Text>
            <Text style={{ color: COLORS.grey, fontSize: 13 }}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}