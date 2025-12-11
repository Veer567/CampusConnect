import React, { createContext, useContext, useState } from "react";
import { View, StyleSheet } from "react-native";
import NotificationCard from "./NotificationCard";

interface Notification {
  id: string;
  avatar?: string;
  name?: string;
  message?: string;
  time?: string;
  color?: string;
  previewImage?: string;
  onReply?: () => void;
  onPress?: () => void;
}

interface NotificationContextType {
  show: (notification: Omit<Notification, "id">) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Notification[]>([]);

  function show(notification: Omit<Notification, "id">) {
    const id = Date.now().toString();
    setItems((prev) => [...prev, { id, ...notification }]);

    setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <NotificationContext.Provider value={{ show }}>
      {children}

      <View style={styles.container}>
        {items.map((item) => (
          <NotificationCard
            key={item.id}
            avatar={item.avatar || ""}
            name={item.name || ""}
            message={item.message || ""}
            time={item.time || ""}
            color={item.color}
            previewImage={item.previewImage}
            onReply={item.onReply}
            onPress={item.onPress}
            onClose={() => remove(item.id)}
          />
        ))}
      </View>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be inside NotificationProvider");
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    width: "100%",
    zIndex: 6000,
  },
});
