// Import dependencies and necessary components
import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/themes";

// Bottom tab layout configuration
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Hide text labels under icons
        tabBarShowLabel: false,
        // Remove default header from each screen
        headerShown: false,
        // Set inactive icon color
        tabBarInactiveTintColor: COLORS.grey,
        // Customize bottom tab bar appearance
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          position: "absolute",
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 5,
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="home" size={focused ? 28 : 24} color={color} />
          ),
        }}
      />

      {/* Bookmarks Tab */}
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: "Bookmarks",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="bookmark"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
        }}
      />

      {/* Create Post Tab (custom floating action button style) */}
      <Tabs.Screen
        name="create"
        options={{
          title: "create",
          tabBarIcon: () => (
            <View style={styles.createButtonWrapper}>
              {/* Floating action button for creating posts */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.createButton}
                onPress={() => router.push("/create")}
              >
                <Ionicons name="add-circle" size={50} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Notifications Tab */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="notifications"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="person" size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Styles for floating action button and layout adjustments
const styles = StyleSheet.create({
  createButtonWrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  createButton: {
    width: 50,
    height: 50,
    borderRadius: 50 / 2,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // Adds subtle depth on Android
  },
});