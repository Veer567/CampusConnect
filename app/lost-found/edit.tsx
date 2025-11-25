import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;

export default function EditLostItem() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const item = useQuery(
    api.lostItems.getItemById,
    id ? { id: id as any } : "skip"
  );

  const updateLostItem = useMutation(api.lostItems.updateLostItem);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"lost" | "found">("lost");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || "");
      setLocation(item.location || "");
      setStatus(item.status as "lost" | "found");
      setImageUrl(item.imageUrl || null);
    }
  }, [item]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) setImageUrl(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    try {
      await updateLostItem({
        id: id as any,
        title,
        description,
        location,
        status,
        category: undefined,
        imageUrl: imageUrl || undefined,
      });

      Alert.alert("Updated!", "Your item was successfully updated.");
     router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Update failed");
    }
  };

  if (!item)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Edit Lost & Found Item</Text>

        {/* Title */}
        <Text style={styles.label}>Item Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Black Laptop Bag"
          placeholderTextColor="#aaa"
        />

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          multiline
          onChangeText={setDescription}
          placeholder="Describe the item..."
          placeholderTextColor="#aaa"
        />

        {/* Location */}
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Library 2nd Floor"
          placeholderTextColor="#aaa"
        />

        {/* Status */}
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {["lost", "found"].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.chip,
                status === s && styles.chipActive,
              ]}
              onPress={() => setStatus(s as "lost" | "found")}
            >
              <Text
                style={[
                  styles.chipText,
                  status === s && { color: "#fff" },
                ]}
              >
                {s.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image Picker */}
        <Text style={styles.label}>Image</Text>

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <>
              <Ionicons name="image-outline" size={42} color="#777" />
              <Text style={styles.imageText}>Upload Image</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/*───────────────────────────────────────────────
   RESPONSIVE PREMIUM STYLES
───────────────────────────────────────────────*/
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    paddingHorizontal: wp(5),
    paddingTop: 20,
    paddingBottom: 30,
  },

  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222",
    marginBottom: 22,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 14,
    color: "#333",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E1E5EB",
  },

  textArea: {
    height: 110,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  statusRow: {
    flexDirection: "row",
    marginTop: 6,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },

  chipActive: {
    backgroundColor: COLORS.primary,
  },

  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },

  imagePicker: {
    height: 190,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageText: {
    color: "#666",
    fontSize: 15,
    marginTop: 6,
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    marginTop: 28,
    borderRadius: 12,
  },

  submitText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
