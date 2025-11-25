import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export default function SettingsDrawer() {
  const router = useRouter();

  type IoniconName = ComponentProps<typeof Ionicons>["name"];

  const items: { label: string; icon: IoniconName; route: string }[] = [
    { label: "FAQ", icon: "help-circle-outline", route: "/(settings)/faq" },
    { label: "Support", icon: "headset-outline", route: "/(settings)/support" },
    { label: "Report Issue", icon: "alert-circle-outline", route: "/(settings)/report" },
    { label: "Terms & Conditions", icon: "document-text-outline", route: "/(settings)/terms" },
    { label: "Privacy Policy", icon: "shield-checkmark-outline", route: "/(settings)/privacy" },
    { label: "Delete Account", icon: "trash-outline", route: "/(settings)/delete" },
    { label: "Developer – Viral", icon: "code-slash-outline", route: "/(settings)/dev-viral" },
    { label: "Developer – Vikas", icon: "terminal-outline", route: "/(settings)/dev-vikas" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 20 }}>
        Settings
      </Text>

      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
          }}
          onPress={() => router.push(item.route as any)}
        >
          <Ionicons name={item.icon} size={22} color="#555" />
          <Text style={{ marginLeft: 12, fontSize: 16, color: "#333" }}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
