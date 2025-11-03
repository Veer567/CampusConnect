import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { StatusBar } from "expo-status-bar";

const notifications = [
  { id: "1", text: "Your post received 12 new likes ❤️", icon: "heart" },
  { id: "2", text: "You have a new follower 🎉", icon: "person-add" },
  { id: "3", text: "Weekly summary: 5 new comments 💬", icon: "chatbubble" },
  { id: "4", text: "New feature update available ⚡", icon: "flash" },
  { id: "5", text: "Your post was shared 3 times 🔁", icon: "share-social" },
];

export default function NotificationScreen() {
  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.surfaceLight]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <Ionicons name="notifications" size={26} color={COLORS.primary} />
        </View>

        {/* Notification List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const fadeAnim = new Animated.Value(0);
            const scaleAnim = new Animated.Value(0.95);

            // Entry Animation
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 600,
              delay: index * 120,
              useNativeDriver: true,
            }).start();

            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 6,
              delay: index * 100,
              useNativeDriver: true,
            }).start();

            return (
              <Animated.View
                style={[
                  styles.cardContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={["#ffffff", "#f9fafb"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.card}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.text}>{item.text}</Text>
                  </View>

                  <TouchableOpacity style={styles.optionsBtn}>
                    <MaterialIcons
                      name="more-vert"
                      size={20}
                      color={COLORS.grey}
                    />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            );
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    marginTop:30
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  list: {
    paddingBottom: 80,
  },
  cardContainer: {
    marginBottom: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.8,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(37, 179, 211, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  text: {
    color: "#222",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  optionsBtn: {
    paddingHorizontal: 6,
  },
});
