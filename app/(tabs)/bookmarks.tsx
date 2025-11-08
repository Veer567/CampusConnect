// Import necessary dependencies and UI components
import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { StatusBar } from "expo-status-bar";
import AppHeader from "@/components/AppHeader";

// Get screen width and height for responsive styling
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

// Main Bookmarks Screen component
export default function Bookmarks() {
  // Sample bookmarked items (mock data)
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
    // Background gradient for a soft, modern appearance
    <LinearGradient
      colors={["#EFF6FF", "#FFFFFF"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* App Header with title and bookmark icon */}
        <AppHeader title="Bookmarks" rightIcon="bookmark" />

        {/* Scrollable list of bookmarks */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Check if there are bookmarks to display */}
          {bookmarks.length > 0 ? (
            bookmarks.map((item) => (
              // Each bookmark card
              <View key={item.id} style={styles.card}>
                {/* Event image */}
                <Image source={{ uri: item.image }} style={styles.image} />

                {/* Card content section */}
                <View style={styles.cardContent}>
                  {/* Event title */}
                  <Text style={styles.title}>{item.title}</Text>

                  {/* Event date */}
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.infoText}>{item.date}</Text>
                  </View>

                  {/* Event location */}
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.infoText}>{item.location}</Text>
                  </View>

                  {/* Action buttons: Share and Remove Bookmark */}
                  <View style={styles.actions}>
                    {/* Share button with gradient background */}
                    <TouchableOpacity activeOpacity={0.85}>
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.shareButton}
                      >
                        <Ionicons name="share-outline" size={18} color="#fff" />
                        <Text style={styles.shareText}>Share</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Bookmark toggle button */}
                    <TouchableOpacity activeOpacity={0.7}>
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
            // Empty state when there are no bookmarks
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

// Styles for layout and components
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Scrollable content padding
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(10),
  },

  // Card container for each bookmarked event
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: wp(4),
    marginBottom: hp(2),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#f0f0f0",
    marginTop: hp(2),
  },

  // Image at the top of the card
  image: {
    width: "100%",
    height: hp(23),
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
  },

  // Card content container
  cardContent: {
    padding: wp(4),
  },

  // Event title
  title: {
    fontSize: wp(4.5),
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: hp(0.5),
  },

  // Info row (icon + text)
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(0.3),
  },

  // Text inside info rows (date, location)
  infoText: {
    color: COLORS.textSecondary,
    fontSize: wp(3.5),
    marginLeft: wp(1.5),
  },

  // Action row for Share and Bookmark buttons
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp(1.5),
  },

  // Share button styling
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: wp(3),
  },

  // Text label on share button
  shareText: {
    color: "#fff",
    fontSize: wp(3.5),
    fontWeight: "600",
    marginLeft: wp(2),
  },

  // Empty state container
  emptyContainer: {
    alignItems: "center",
    marginTop: hp(15),
  },

  // Empty state message text
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: wp(4),
    marginTop: hp(2),
  },
});
