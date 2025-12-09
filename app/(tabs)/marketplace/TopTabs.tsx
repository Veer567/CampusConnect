import { COLORS } from "@/constants/themes";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import HackathonsScreen from "./screens/HackathonsScreen";
import ProjectScreen from "./screens/ProjectScreen";
import StartupsScreen from "./screens/StartupsSreen";

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

const Tab = createMaterialTopTabNavigator();

export default function TopTabs({
  initialTab,
}: {
  initialTab: "project" | "hackathon" | "startup";
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const tabs = ["Projects", "Hackathons", "Startups"];
  const tabWidth = width / tabs.length;

  const animate = (index: number) => {
    Animated.spring(translateX, {
      toValue: index * tabWidth,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Tab.Navigator
      initialRouteName={
        initialTab === "hackathon"
          ? "Hackathons"
          : initialTab === "startup"
            ? "Startups"
            : "Projects"
      }
      tabBar={({ state, navigation, descriptors }) => {
        return (
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: Platform.OS === "ios" ? 6 : 0,
              paddingBottom: 6,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                position: "relative",
              }}
            >
              {/* 🔵 Animated Indicator */}
              <Animated.View
                style={{
                  position: "absolute",
                  height: 32,
                  width: tabWidth - wp(10),
                  backgroundColor: "rgba(255,255,255,0.25)",
                  borderRadius: 10,
                  transform: [{ translateX }],
                  left: wp(5),
                }}
              />

              {/* TAB LABELS */}
              {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const label =
                  descriptors[route.key].options.title ?? route.name;

                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={() => {
                      navigation.navigate(route.name);
                      animate(index);
                    }}
                    style={{
                      width: tabWidth,
                      paddingVertical: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: isFocused ? "#fff" : "rgba(255,255,255,0.7)",
                        fontWeight: isFocused ? "700" : "500",
                        fontSize: wp(3.8),
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </LinearGradient>
        );
      }}
    >
      <Tab.Screen name="Projects" component={ProjectScreen} />
      <Tab.Screen name="Hackathons" component={HackathonsScreen} />
      <Tab.Screen name="Startups" component={StartupsScreen} />
    </Tab.Navigator>
  );
}
