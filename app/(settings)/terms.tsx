import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, StyleSheet, Pressable, View } from "react-native";

import useBackToSettingsRoot from "@/hooks/useBackToSettingsRoot";
import { COLORS } from "@/constants/themes";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Terms() {
  const router = useRouter();
  useBackToSettingsRoot();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView style={styles.container}>
      
      {/* Back Button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#222" />
      </Pressable>

      {/* Title */}
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.date}>Last Updated: {new Date().toDateString()}</Text>

      {/* SECTION 1 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By downloading, accessing, or using CampusConnect (“the App”), you
          agree to comply with and be bound by these Terms & Conditions. If you
          do not agree, you may not use the application.
        </Text>
      </View>

      {/* SECTION 2 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>2. Eligibility</Text>
        <Text style={styles.text}>
          CampusConnect is intended for college and university students. You
          must be at least the legal minimum age in your region to use the
          App. By using CampusConnect, you confirm that the information you
          provide is accurate.
        </Text>
      </View>

      {/* SECTION 3 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>3. User Accounts</Text>
        <Text style={styles.text}>
          To access the App, you must create an account. You are responsible
          for maintaining the confidentiality of your login credentials. Any
          activity that occurs under your account is your responsibility.
        </Text>
      </View>

      {/* SECTION 4 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>4. User Content</Text>
        <Text style={styles.text}>
          You are responsible for any content you upload, post, or share,
          including posts, marketplace listings, lost & found reports, and
          messages.
        </Text>
        <Text style={styles.text}>
          You agree not to upload or share content that is:
        </Text>
        <Text style={styles.text}>
          • Illegal, harmful, or abusive{"\n"}
          • Harassing, threatening, or discriminatory{"\n"}
          • False, misleading, or inappropriate{"\n"}
          • Violating copyrights or intellectual property rights
        </Text>
      </View>

      {/* SECTION 5 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>5. Prohibited Activities</Text>
        <Text style={styles.text}>
          You agree NOT to:
        </Text>
        <Text style={styles.text}>
          • Use the App for fraud or malicious behavior{"\n"}
          • Attempt to hack, exploit, or damage the App{"\n"}
          • Impersonate others{"\n"}
          • Share explicit, harmful, or offensive content{"\n"}
          • Upload viruses or security threats
        </Text>
      </View>

      {/* SECTION 6 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>6. Privacy</Text>
        <Text style={styles.text}>
          Your use of the App is also governed by our Privacy Policy, which
          explains how we collect and use your information.
        </Text>
      </View>

      {/* SECTION 7 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>7. Termination of Use</Text>
        <Text style={styles.text}>
          We reserve the right to suspend or remove accounts that violate these
          Terms, engage in harmful behavior, or misuse the platform.
        </Text>
      </View>

      {/* SECTION 8 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>8. Intellectual Property</Text>
        <Text style={styles.text}>
          The App, including logo, name, design, and features, is the property
          of CampusConnect developers. You may not copy, modify, distribute, or
          exploit any part of the App.
        </Text>
      </View>

      {/* SECTION 9 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>9. Disclaimer of Liability</Text>
        <Text style={styles.text}>
          CampusConnect is provided “as is” without warranties. We are not
          responsible for:
        </Text>
        <Text style={styles.text}>
          • Incorrect or misleading content posted by users{"\n"}
          • Technical issues, app downtime, or errors{"\n"}
          • Loss of data or device damage
        </Text>
      </View>

      {/* SECTION 10 */}
      <View style={styles.sectionBox}>
        <Text style={styles.heading}>10. Changes to Terms</Text>
        <Text style={styles.text}>
          We may update these Terms at any time. Major changes will be
          communicated through the App.
        </Text>
      </View>

      {/* SECTION 11 */}
      <View style={[styles.sectionBox, { marginBottom: 60 }]}>
        <Text style={styles.heading}>11. Contact Us</Text>
        <Text style={styles.text}>
          For questions or concerns, contact us at:
          {"\n"}support.campusconnect@gmail.com
        </Text>
      </View>

    </ScrollView>
    </SafeAreaView>
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
    marginBottom: 12,
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
    marginBottom: 20,
  },

  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },

  text: {
    fontSize: 15,
    color: "#555",
    lineHeight: 21,
  },
});
