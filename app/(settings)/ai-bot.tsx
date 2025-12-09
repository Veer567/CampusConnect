import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import axios from "axios";
import Constants from "expo-constants";
import { FAQ_DATA } from "../../data/faqs";

/* ------------------------- AI API CALL FUNCTION --------------------------- */

async function askAI(message: string) {
  try {
    const apiKey = Constants.expoConfig?.extra?.openaiApiKey;

    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a friendly support assistant. Keep answers short and helpful.",
          },
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    console.log("AI ERROR:", err);
    return "Sorry, I couldn't connect to AI right now.";
  }
}

/* --------------------------- COMPONENT ----------------------------------- */

export default function AIBotScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  const chatRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Show user message
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    // Show temporary "typing"
    setMessages((prev) => [...prev, { role: "assistant", text: "Typing..." }]);

    // Get AI response
    const aiReply = await askAI(text);

    // Replace last message with real AI response
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = { role: "assistant", text: aiReply };
      return updated;
    });
  };

  useEffect(() => {
    chatRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
        </Pressable>

        <Text style={styles.headerTitle}>AI Help Assistant</Text>

        <Ionicons name="chatbubbles-outline" size={24} color="#1A1A1A" />
      </View>

      {/* CONTENT */}
      <View style={{ flex: 1 }}>
        
        {/* FAQ Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {FAQ_DATA.map((item, i) => (
            <Pressable key={i} style={styles.chip} onPress={() => sendMessage(item.question)}>
              <Text style={styles.chipText}>{item.question}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* CHAT */}
        <ScrollView ref={chatRef} style={styles.chatArea}>
          {messages.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                msg.role === "user" ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text style={styles.msgText}>{msg.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* INPUT */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your question..."
          value={input}
          onChangeText={setInput}
          placeholderTextColor="#999"
        />

        <Pressable style={styles.sendBtn} onPress={() => sendMessage(input)}>
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

/* -------------------------------- STYLES ------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFE",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
    elevation: 3,
  },
  backBtn: {
    paddingRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  chipScroll: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  chip: {
    backgroundColor: "#E7F0FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A73E8",
  },

  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  bubble: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    maxWidth: "75%",
  },
  userBubble: {
    backgroundColor: "#D1F8CE",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#EDEDED",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },

  inputRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 15,
    color: "#000",
  },
  sendBtn: {
    backgroundColor: "#1A73E8",
    padding: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
});
