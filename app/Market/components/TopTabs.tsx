import {
  createMaterialTopTabNavigator,
  MaterialTopTabBar,
  MaterialTopTabNavigationProp,
} from "@react-navigation/material-top-tabs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { View } from "react-native";
import HackathonsScreen from "../screen/HackathonsScreen";
import ProjectsScreen from "../screen/ProjectScreen";
import StartupsScreen from "../screen/StartupsSreen";

const Tab = createMaterialTopTabNavigator();

type TopTabsProps = {
  initialTab?: string;
};

export default function TopTabs({ initialTab }: TopTabsProps) {
  return (
    <Tab.Navigator
      initialRouteName="Projects"
      screenOptions={{
        lazy: true,
        swipeEnabled: true,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
        tabBarIndicatorStyle: {
          backgroundColor: "#fff",
          height: 3,
          borderRadius: 3,
        },
        tabBarStyle: {
          backgroundColor: "transparent",
          elevation: 0,
        },
      }}
      tabBar={(props) => {
        // ⭐ Run the effect inside tabBar so we get props.navigation
        useEffect(() => {
          if (!initialTab) return;

          const routeName =
            initialTab === "project"
              ? "Projects"
              : initialTab === "hackathon"
                ? "Hackathons"
                : "Startups";

          // ⭐ Cast navigation to the correct type so TS knows jumpTo() exists
          const nav = props.navigation as unknown as MaterialTopTabNavigationProp<any>;
          nav.jumpTo(routeName);
        }, [initialTab]);

        return (
          <LinearGradient
            colors={["#3B82F6", "#0EA5E9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={{ backgroundColor: "transparent", elevation: 0 }}>
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
