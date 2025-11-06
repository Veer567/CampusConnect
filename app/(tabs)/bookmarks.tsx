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

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

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
    <LinearGradient
      colors={["#EFF6FF", "#FFFFFF"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor={COLORS.primary} />

        <AppHeader title="Bookmarks" rightIcon="bookmark" />

        {/* Scrollable List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.infoText}>{item.date}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.infoText}>{item.location}</Text>
                  </View>

                  <View style={styles.actions}>
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
  container: {
    flex: 1,
  },

  // HEADER
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(3),
    paddingHorizontal: wp(5),

    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: hp(2),
  },
  headerText: {
    fontSize: wp(5.2),
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.4,
  },

  // SCROLL CONTENT
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(10),
  },

  // CARD
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
    marginTop : hp(2),
  },
  image: {
    width: "100%",
    height: hp(23),
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
  },
  cardContent: {
    padding: wp(4),
  },
  title: {
    fontSize: wp(4.5),
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: hp(0.5),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(0.3),
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: wp(3.5),
    marginLeft: wp(1.5),
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp(1.5),
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: wp(3),
  },
  shareText: {
    color: "#fff",
    fontSize: wp(3.5),
    fontWeight: "600",
    marginLeft: wp(2),
  },

  // EMPTY STATE
  emptyContainer: {
    alignItems: "center",
    marginTop: hp(15),
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: wp(4),
    marginTop: hp(2),
  },
});
