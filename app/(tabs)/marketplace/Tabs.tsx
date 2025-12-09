import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/themes";
import TopTabs from "./TopTabs";

type MarketplaceTabsProps = {
  initialTab?: "project" | "hackathon" | "startup";
};

export default function MarketplaceTabs({ initialTab }: MarketplaceTabsProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={[]}>
      {/* HEADER */}
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

      {/* TOP TABS */}
      <TopTabs initialTab={initialTab || "project"} />
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
