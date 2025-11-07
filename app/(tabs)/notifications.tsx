import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import AppHeader from "@/components/AppHeader";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

const notifications = [
  { id: "1", text: "Your post received 12 new likes ❤️", icon: "heart" },
  { id: "2", text: "You have a new follower 🎉", icon: "person-add" },
  { id: "3", text: "Weekly summary: 5 new comments 💬", icon: "chatbubble" },
  { id: "4", text: "New feature update available ⚡", icon: "flash" },
  { id: "5", text: "Your post was shared 3 times 🔁", icon: "share-social" },
];

export default function NotificationScreen() {
  const fadeAnims = useRef(
    notifications.map(() => new Animated.Value(0))
  ).current;
  const scaleAnims = useRef(
    notifications.map(() => new Animated.Value(0.95))
  ).current;

  // Animate on every screen focus
  useFocusEffect(
    useCallback(() => {
      fadeAnims.forEach((fadeAnim, index) => {
        fadeAnim.setValue(0);
        scaleAnims[index].setValue(0.95);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            delay: index * 120,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnims[index], {
            toValue: 1,
            friction: 6,
            delay: index * 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, [])
  );

  return (
    <LinearGradient
      colors={["#EFF6FF", "#FFFFFF"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
       

        {/* Shared Header */}
        <AppHeader title="Notifications" rightIcon="notifications" />

        {/* Notification List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View
              style={{
                opacity: fadeAnims[index],
                transform: [{ scale: scaleAnims[index] }],
              }}
            >
              <LinearGradient
                colors={["#FFFFFF", "#F9FAFB"]}
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
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(12),
    paddingTop: hp(1),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(1.5),
    borderWidth: 0.8,
    borderColor: "#E5E7EB",
    backgroundColor: COLORS.surface,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconContainer: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3.5),
  },
  text: {
    color: COLORS.text,
    fontSize: wp(3.8),
    lineHeight: wp(5),
    fontWeight: "500",
  },
  optionsBtn: {
    paddingHorizontal: wp(1.5),
  },
});
