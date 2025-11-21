import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/themes";
import { useLocalSearchParams } from "expo-router";
import TopTabs from "../Market/components/TopTabs";

export default function MarketplaceTabs() {
  const { tab } = useLocalSearchParams();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* HEADER */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* 👇 FIXED: STACKED TITLE + SUBTITLE */}
        <View style={{ alignItems: "flex-start" }}>
          <Text style={styles.title}>Innovation Hub</Text>
          <Text style={styles.subtitle}>
            Find ideas. Join Teams. Build Together
          </Text>
        </View>
      </LinearGradient>

      <TopTabs initialTab={tab as string} />
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
    marginBottom: 2, // small gap
  },
  subtitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "400",
    opacity: 0.9,
  },
});
