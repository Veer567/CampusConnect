import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../../constants/themes";
import { api } from "../../../convex/_generated/api";

export default function CreateMarketplace() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const [location, setLocation] = useState("");

  const [postType, setPostType] = useState<"project" | "hackathon" | "startup">(
    typeof type === "string" &&
      ["project", "hackathon", "startup"].includes(type)
      ? (type as any)
      : "project"
  );

  const createPost = useMutation(api.marketplace.createMarketplacePost);

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [lastDateToJoin, setLastDateToJoin] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // ⭐ FIX: Back button override
  useEffect(() => {
    const backAction = () => {
      router.replace(`/marketplace?tab=${postType}`);
      return true; // block default back navigation
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => sub.remove();
  }, [postType]);

  // ⭐ Handle Submit
  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Title and description are required.");
      return;
    }

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    await createPost({
      type: postType as any,
      title,
      description,
      tags: tagArray,
      lookingFor,
      eventDate: eventDate || undefined,
      lastDateToJoin: lastDateToJoin || undefined,
      imageUrl: image || undefined,
      location: location || "Remote",
    });

    // ⭐ FIX: Correct redirect
    router.replace(`/marketplace?tab=${postType}`);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 1 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ⭐ Custom Back Button */}
        <TouchableOpacity
          onPress={() => router.replace(`/marketplace?tab=${postType}`)}
          style={{
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={26} color={COLORS.text} />
          <Text style={{ fontSize: 17, marginLeft: 6, color: COLORS.text }}>
            Back
          </Text>
        </TouchableOpacity>

        <Text style={styles.header}>
          Create {postType.charAt(0).toUpperCase() + postType.slice(1)}
        </Text>

        {/* Type Buttons */}
        <View style={styles.typeRow}>
          {["project", "hackathon", "startup"].map((t) => {
            const active = t === postType;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setPostType(t as any)} // ⭐ CHANGE TYPE IN STATE
                style={[styles.typeBtn, active && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, active && { color: "#fff" }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Cover Image</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          {!image ? (
            <>
              <Text style={styles.uploadText}>Upload Cover Image</Text>
              <Text style={styles.uploadSub}>Tap to select an image</Text>
            </>
          ) : (
            <Image source={{ uri: image }} style={styles.previewImage} />
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter a catchy title..."
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your idea..."
          multiline
          style={[styles.input, { minHeight: 120 }]}
        />

        <Text style={styles.label}>Skills & Tags</Text>
        <TextInput
          value={tags}
          onChangeText={setTags}
          placeholder="React, UI Design..."
          style={styles.input}
        />

        <Text style={styles.label}>Looking For</Text>
        <TextInput
          value={lookingFor}
          onChangeText={setLookingFor}
          placeholder="Backend dev, designer..."
          style={styles.input}
        />

        <Text style={styles.label}>Event Date</Text>
        <TextInput
          value={eventDate}
          onChangeText={setEventDate}
          placeholder="YYYY-MM-DD"
          style={styles.input}
        />

        <Text style={styles.label}>Last Date to Join</Text>
        <TextInput
          value={lastDateToJoin}
          onChangeText={setLastDateToJoin}
          placeholder="YYYY-MM-DD"
          style={styles.input}
        />

        <Text style={styles.label}>Location (City / Remote)</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Mumbai, Delhi, Remote..."
          style={styles.input}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submit}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.submitGradient}
          >
            <Text style={styles.submitText}>
              Post {postType.charAt(0).toUpperCase() + postType.slice(1)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 18,
    color: COLORS.text,
  },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  typeBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtnActive: { backgroundColor: COLORS.primary },
  typeBtnText: { color: COLORS.text, fontWeight: "700" },

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
    color: COLORS.text,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  uploadText: { fontWeight: "700", color: COLORS.text },
  uploadSub: { color: COLORS.textSecondary, marginTop: 6 },

  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },

  previewImage: { width: "100%", height: 220, borderRadius: 12 },

  submitBtn: { marginTop: 24, borderRadius: 14, overflow: "hidden" },
  submitGradient: { padding: 16, borderRadius: 14, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
