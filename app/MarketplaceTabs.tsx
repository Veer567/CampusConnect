// app/MarketplaceTabs.tsx
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/themes"; // ← FIXED PATH
import TopTabs from "./Market/components/TopTabs";

type MarketplaceTabsProps = {
  initialTab?: "project" | "hackathon" | "startup";
};

export default function MarketplaceTabs({ initialTab }: MarketplaceTabsProps) {
  const TopTabsAny = TopTabs as any;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={{ alignItems: "flex-start" }}>
          <Text style={styles.title}>Innovation Hub</Text>
          <Text style={styles.subtitle}>
            Find ideas. Join Teams. Build Together
          </Text>
        </View>
      </LinearGradient>
      {/* Connect to TopTabs */}
      <TopTabsAny initialTab={initialTab} />
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 2,
  },
  subtitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "400",
    opacity: 0.9,
  },
});
