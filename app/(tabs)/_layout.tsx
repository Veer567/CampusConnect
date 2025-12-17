import { Tabs, router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Fontisto from "@expo/vector-icons/Fontisto";
import { COLORS } from "@/constants/themes";
import GlobalAlert from "@/components/GlobalAlert";

export default function TabLayout() {
  return (
    <>
      {/* Global Alert visible above all tabs */}
      <GlobalAlert />

      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          headerShown: false,
          tabBarInactiveTintColor: COLORS.grey,
          tabBarActiveTintColor: COLORS.primary,
          tabBarStyle: {
            backgroundColor: "white",
            borderTopWidth: 0,
            height: 60,
            paddingBottom: 8,
            paddingTop: 5,
            position: "absolute",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="home" size={focused ? 28 : 24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="marketplace"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name="storefront-outline"
                size={focused ? 28 : 24}
                color={color}
              />
            ),
          }}
        />

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

        <Tabs.Screen
          name="lost-found"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Fontisto name="dropbox" size={focused ? 28 : 24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="person" size={focused ? 28 : 24} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
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
    backgroundColor: COLORS.surface,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
});
