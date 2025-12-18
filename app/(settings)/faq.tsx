import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FAQ() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        marginTop: Platform.OS === "android" ? -36 : 0,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#222" />
        </Pressable>

        <Text style={styles.title}>Frequently Asked Questions</Text>

        {/* 🔔 NOTIFICATIONS (IMPORTANT – TOP) */}
        <Text style={styles.q}>1. Why am I not receiving notifications?</Text>
        <Text style={styles.a}>
          Enable notifications for this app from your phone settings and keep
          the app updated to the latest version.
        </Text>

        <Text style={styles.q}>2. How do I allow notification permission?</Text>
        <Text style={styles.a}>
          On Android: Go to Settings → Apps → This App → Notifications → Allow.
          {"\n\n"}
          On iPhone: Go to Settings → Notifications → This App → Allow
          Notifications.
        </Text>

        <Text style={styles.q}>
          3. Notifications are enabled but still not coming. What should I do?
        </Text>
        <Text style={styles.a}>
          Try reopening the app, logging out and logging back in, or restarting
          your device. Also ensure the app is updated to the latest version.
        </Text>

        <Text style={styles.q}>
          4. Do notifications work when the app is closed?
        </Text>
        <Text style={styles.a}>
          Yes, notifications are delivered even when the app is closed, as long
          as notification permission is enabled and internet is available.
        </Text>

        {/* PROFILE */}
        <Text style={styles.q}>5. How do I update my profile?</Text>
        <Text style={styles.a}>Open Profile → Edit Profile → Save.</Text>

        <Text style={styles.q}>6. Why is my name not visible on posts?</Text>
        <Text style={styles.a}>
          Your username is shown by default. You can add or update your full
          name from Edit Profile anytime.
        </Text>

        {/* ACCOUNT */}
        <Text style={styles.q}>7. How do I reset my password?</Text>
        <Text style={styles.a}>
          Go to Settings → Account → Change Password to reset it.
        </Text>

        <Text style={styles.q}>8. Can I change my email address?</Text>
        <Text style={styles.a}>
          Currently, email changes must be done through account verification.
          Please contact support if needed.
        </Text>

        {/* POSTS */}
        <Text style={styles.q}>9. How do I create a post?</Text>
        <Text style={styles.a}>
          Tap the “+” button on the home screen, add details, and publish.
        </Text>

        <Text style={styles.q}>10. Can I edit or delete my post?</Text>
        <Text style={styles.a}>
          Yes. Open your post → tap the three dots → Edit or Delete.
        </Text>

        <Text style={styles.q}>11. Why can’t I like my own post?</Text>
        <Text style={styles.a}>
          To keep interactions meaningful, liking your own posts is disabled.
        </Text>

        {/* CHAT */}
        <Text style={styles.q}>12. How do I send a message to someone?</Text>
        <Text style={styles.a}>
          Open their profile and tap the “Message” button to start a chat.
        </Text>

        <Text style={styles.q}>13. What does “online” or “typing…” mean?</Text>
        <Text style={styles.a}>
          “Online” shows active users. “Typing…” appears when the other person
          is currently typing a message.
        </Text>

        <Text style={styles.q}>14. Can I delete or edit a message?</Text>
        <Text style={styles.a}>
          Yes. Long-press your message to edit or delete it.
        </Text>

        {/* NOTIFICATIONS */}
        <Text style={styles.q}>15. Why am I getting notifications?</Text>
        <Text style={styles.a}>
          Notifications are sent for likes, comments, follows, and messages.
        </Text>

        <Text style={styles.q}>16. How do I clear notifications?</Text>
        <Text style={styles.a}>
          Open Notifications → tap the trash icon → confirm.
        </Text>

        {/* SAFETY */}
        <Text style={styles.q}>17. How do I report a user?</Text>
        <Text style={styles.a}>
          Go to Settings → Report a Problem and provide details.
        </Text>

        <Text style={styles.q}>18. How do I block someone?</Text>
        <Text style={styles.a}>
          Blocking is currently under development and will be available soon.
        </Text>

        {/* ACCOUNT */}
        <Text style={styles.q}>19. How do I delete my account?</Text>
        <Text style={styles.a}>
          Go to Settings → Delete Account. This action is permanent.
        </Text>

        <Text style={styles.q}>20. Is my data secure?</Text>
        <Text style={styles.a}>
          Yes. We follow industry-standard security practices to protect your
          data.
        </Text>

        {/* SUPPORT */}
        <Text style={styles.q}>21. How can I contact support?</Text>
        <Text style={styles.a}>
          Use Settings → Help & Support to reach our team.
        </Text>

        <Text style={styles.q}>
          22. The app isn’t working properly. What should I do?
        </Text>
        <Text style={styles.a}>
          Try restarting the app or updating to the latest version. If the issue
          persists, contact support.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
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
    fontSize: 26,
    fontWeight: "700",
    marginTop: 10,
  },
  q: {
    marginTop: 25,
    fontSize: 18,
    fontWeight: "600",
  },
  a: {
    marginTop: 6,
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
});
