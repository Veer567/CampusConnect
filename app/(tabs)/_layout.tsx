import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/themes";
import Fontisto from '@expo/vector-icons/Fontisto';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarInactiveTintColor: COLORS.grey,
        tabBarActiveTintColor: COLORS.primary,
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
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="home" size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
        {/* MARKETPLACE */}
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Marketplace",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="storefront-outline"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
        }}
      />



      {/* CREATE FAB */}
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: () => (
            <View style={styles.createButtonWrapper}>
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

          {/* LOST & FOUND */}
      <Tabs.Screen
        name="lost-found"
        options={{
          title: "Lost & Found",
          tabBarIcon: ({ color, focused }) => (
            <Fontisto
              name="dropbox"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="person" size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButtonWrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  createButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});
