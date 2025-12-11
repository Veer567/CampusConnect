import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
} from "react-native-reanimated";

interface NotificationCardProps {
  avatar: string;
  name: string;
  message: string;
  time?: string;
  color?: string;
  previewImage?: string;
  onReply?: () => void;
  onPress?: () => void;
  onClose: () => void;
}

export default function NotificationCard({
  avatar,
  name,
  message,
  time = "now",
  color = "#4caf50", // default green
  previewImage,
  onReply,
  onPress,
  onClose
}: NotificationCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.springify().mass(0.4)}
      exiting={FadeOutUp}
      style={[styles.card, { borderLeftColor: color }]}
    >
      {/* Close button */}
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Text style={{ fontSize: 18, opacity: 0.5 }}>×</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={onPress}>
        
        {/* Avatar + dot */}
        <View style={styles.avatarWrap}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={[styles.dot, { backgroundColor: color }]} />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.time}>{time}</Text>

          {onReply && (
            <Pressable onPress={onReply}>
              <Text style={[styles.reply, { color }]}>Reply</Text>
            </Pressable>
          )}
        </View>

        {/* Optional preview image */}
        {previewImage && (
          <Image source={{ uri: previewImage }} style={styles.preview} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "92%",
    alignSelf: "center",
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderLeftWidth: 6,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "visible",
  },
  row: {
    flexDirection: "row",
  },
  avatarWrap: {
    marginRight: 12,
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 25,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 10,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  reply: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  preview: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginLeft: 10,
  },
  closeBtn: {
    position: "absolute",
    top: 6,
    right: 8,
    zIndex: 10,
  },
});
