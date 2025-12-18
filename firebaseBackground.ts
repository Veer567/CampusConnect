// firebaseBackground.ts
import messaging from "@react-native-firebase/messaging";

// 🔥 REQUIRED for background & killed state notifications
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log("📩 Background FCM message:", remoteMessage);
});
