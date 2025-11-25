import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  View,
} from "react-native";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>

      {/* Back Button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#222" />
      </Pressable>

      {/* Title */}
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.date}>Last Updated: {new Date().toDateString()}</Text>

      {/* SECTION 1 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>1. Introduction</Text>
        <Text style={styles.text}>
          CampusConnect (“we”, “our”, “us”) is committed to protecting your
          privacy. This Privacy Policy explains how we collect, use, and protect
          your information when you use the CampusConnect mobile application.
        </Text>
      </View>

      {/* SECTION 2 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>2. Information We Collect</Text>
        <Text style={styles.subheading}>A. Personal Information</Text>
        <Text style={styles.text}>
          • Name, email, username, profile image{"\n"}
          • Department, year, interests{"\n"}
          • Bio, optional contact details
        </Text>

        <Text style={styles.subheading}>B. Content You Create</Text>
        <Text style={styles.text}>
          • Posts, images, captions{"\n"}
          • Marketplace listings{"\n"}
          • Lost & found items{"\n"}
          • Comments, likes, replies{"\n"}
          • Messages and chats
        </Text>

        <Text style={styles.subheading}>C. Automatically Collected Data</Text>
        <Text style={styles.text}>
          • Device information, IP address{"\n"}
          • Push notification token{"\n"}
          • Usage and activity logs
        </Text>

        <Text style={styles.subheading}>D. Sensitive Data</Text>
        <Text style={styles.text}>
          We do not collect Aadhaar details, bank details, or precise location
          unless you explicitly provide it.
        </Text>
      </View>

      {/* SECTION 3 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>3. How We Use Your Information</Text>
        <Text style={styles.text}>
          • To operate your account{"\n"}
          • To enable posting, messaging, and marketplace features{"\n"}
          • To notify you about updates and alerts{"\n"}
          • To improve app performance{"\n"}
          • To keep the community safe
        </Text>
      </View>

      {/* SECTION 4 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>4. Sharing Your Data</Text>
        <Text style={styles.text}>
          We do NOT sell your personal information. We may share data only:
        </Text>
        <Text style={styles.text}>
          • With other users (posts, comments, your profile){'\n'}
          • With trusted service providers (Clerk, Convex, Expo services){'\n'}
          • When required by law or to ensure safety
        </Text>
      </View>

      {/* SECTION 5 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>5. Your Rights</Text>
        <Text style={styles.text}>
          • You can edit or delete your profile{"\n"}
          • You can delete posts, messages, and content{"\n"}
          • You can disable notifications{"\n"}
          • You can request complete account deletion
        </Text>
      </View>

      {/* SECTION 6 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>6. Data Security</Text>
        <Text style={styles.text}>
          We use secure authentication, encrypted storage, and strict access
          control. While no system is perfectly secure, we take strong measures
          to protect your data.
        </Text>
      </View>

      {/* SECTION 7 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>7. Children’s Privacy</Text>
        <Text style={styles.text}>
          CampusConnect is intended for college/university students. We do not
          knowingly collect information from children below the legal age.
        </Text>
      </View>

      {/* SECTION 8 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>8. Policy Updates</Text>
        <Text style={styles.text}>
          We may update this Privacy Policy occasionally. Material updates will
          be communicated through the app.
        </Text>
      </View>

      {/* SECTION 9 */}
      <View style={[styles.sectionBox, { marginBottom: 50 }]}>
        <Text style={styles.heading}>9. Contact Us</Text>
        <Text style={styles.text}>
          If you have questions or concerns, contact us at:\n
          support.campusconnect@gmail.com
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#222",
  },

  date: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    color: "#666",
  },

  sectionBox: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 18,
  },

  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },

  subheading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
    marginTop: 8,
  },

  text: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
});
