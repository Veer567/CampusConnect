// app/Market/index.tsx
import React, { useEffect } from "react";
import { createMaterialTopTabNavigator, MaterialTopTabBar } from "@react-navigation/material-top-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, Platform, View } from "react-native";
import ProjectsScreen from "../screen/ProjectScreen"
import HackathonsScreen from "../screen/HackathonsScreen"
import StartupsScreen from "../screen/StartupsSreen"

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

export default function MarketIndex() {
  return (
    <Tab.Navigator
      initialRouteName="Projects"
      screenOptions={{
        lazy: true,
        swipeEnabled: true,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
        tabBarIndicatorStyle: {
          backgroundColor: "rgba(255,255,255,0.25)",
          height: "70%",
          borderRadius: 12,
          marginVertical: 6,
        },
        tabBarStyle: {
          backgroundColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
      tabBar={(props) => {
        // small effect to jump to initialTab if needed - not required in most cases
        useEffect(() => {}, []);
        return (
          <LinearGradient
            colors={["#3B82F6", "#0EA5E9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: Platform.OS === "ios" ? 6 : 0,
              paddingBottom: 4,
              elevation: 4,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <View style={{ backgroundColor: "transparent" }}>
              <MaterialTopTabBar {...props} />
            </View>
          </LinearGradient>
        );
      }}
    >
      <Tab.Screen name="Projects" component={ProjectsScreen} />
      <Tab.Screen name="Hackathons" component={HackathonsScreen} />
      <Tab.Screen name="Startups" component={StartupsScreen} />
    </Tab.Navigator>
  );
}
