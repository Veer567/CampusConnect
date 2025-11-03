import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { StatusBar } from "expo-status-bar";

export default function Bookmarks() {
  const bookmarks = [
    {
      id: 1,
      title: "Tech Conference 2025",
      date: "Nov 5, 2025",
      location: "Mumbai, India",
      image:
        "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 2,
      title: "Music Fest Night",
      date: "Dec 1, 2025",
      location: "Goa, India",
      image:
        "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 3,
      title: "Startup Meetup",
      date: "Jan 15, 2026",
      location: "Bangalore, India",
      image:
        "https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=800&q=60",
    },
  ];

  return (
    <LinearGradient colors={["#fdfdfd", "#f6f9ff"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
         <StatusBar style="dark" backgroundColor="#121112ff" />
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Bookmarks</Text>
          <Ionicons name="bookmark" size={24} color={COLORS.primary} />
        </View>

        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {bookmarks.length > 0 ? (
            bookmarks.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.image} />

                <View style={styles.cardContent}>
                  <Text style={styles.title}>{item.title}</Text>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={COLORS.grey}
                    />
                    <Text style={styles.infoText}>{item.date}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={COLORS.grey}
                    />
                    <Text style={styles.infoText}>{item.location}</Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.shareButton}>
                      <Ionicons name="share-outline" size={18} color="#fff" />
                      <Text style={styles.shareText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity>
                      <Ionicons
                        name="bookmark"
                        size={22}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={64} color={COLORS.grey} />
              <Text style={styles.emptyText}>No bookmarks yet</Text>
            </View>
          )}
        </ScrollView>
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
    marginTop:30,
    backgroundColor: 'transparent',


  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
    
  },
  headerText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#ececec",
  },
  image: {
    width: "100%",
    height: 160,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  infoText: {
    color: COLORS.grey,
    fontSize: 14,
    marginLeft: 6,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shareText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 120,
  },
  emptyText: {
    color: COLORS.grey,
    fontSize: 16,
    marginTop: 12,
  },
});
