import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("messages", {
        name: "Messages",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default"
      });
    }

    return token;
  } catch (err) {
    console.warn("Push token registration failed:", err);
    return null;
  }
}
