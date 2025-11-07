import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/themes";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarShowLabel: false,
      headerShown: false,
      tabBarInactiveTintColor: COLORS.grey,
      tabBarStyle: {
        backgroundColor: "white",
        borderTopWidth: 0,
        position: "absolute",
        elevation: 0,
        height: 60,
        paddingBottom: 8,
        paddingTop: 5,
        

      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home", 
          tabBarIcon: ({ color, size , focused}) => (
            <Ionicons name="home" size= {focused ? 28 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: "Bookmarks",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="bookmark" 
            size={focused ? 28 : 24}
             color={color} />
          ),
        }}
      />
      <Tabs.Screen
      
        name="create"
        options={{
          title: "create",
          tabBarIcon: () => (
            <View style={styles.createButtonWrapper}>
              <TouchableOpacity  activeOpacity={0.7} style={styles.createButton}  onPress={() => router.push("/create")}>
                <Ionicons name="add-circle" size={50} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ),

        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="notifications" 
            size={focused ? 28 : 24}
            color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size , focused }) => (
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
    borderRadius: 50 / 2,
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

