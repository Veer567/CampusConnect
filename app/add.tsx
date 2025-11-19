import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { router } from "expo-router";
import { COLORS } from "@/constants/themes";

const CATEGORIES = ["Electronics", "Books", "Accessories", "Clothes", "Other"];

export default function AddLostItem() {
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"lost" | "found">("lost");
  const [category, setCategory] = useState("Electronics");

  const createLostItem = useMutation(api.lostItems.addLostItem);

  // Pick Image
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!res.canceled) setImage(res.assets[0].uri);
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!title || !desc || !location) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }

    try {
      await createLostItem({
        title,
        description: desc,
        location,
        status,
        imageUrl: image ?? "",
      });

      Alert.alert("Success", "Lost/Found item submitted!");
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to upload item.");
      console.log(err);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.header}>Report Item</Text>
      <Text style={styles.subheader}>Help others by reporting lost or found items</Text>

      {/* Image Picker */}
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <>
            <Ionicons name="camera-outline" size={42} color="#888" />
            <Text style={styles.imageText}>Upload Image</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Form Fields */}
      <View style={styles.formCard}>
        {/* Title */}
        <Text style={styles.label}>Item Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Black Laptop Bag"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          placeholder="Describe the item..."
          value={desc}
          onChangeText={setDesc}
        />

        {/* Location */}
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="Library 2nd Floor"
          value={location}
          onChangeText={setLocation}
        />

        {/* Status */}
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {["lost", "found"].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusChip, status === s && styles.statusChipActive]}
              onPress={() => setStatus(s as "lost" | "found")}
            >
              <Text style={[styles.statusText, status === s && styles.statusTextActive]}>
                {s === "lost" ? "Lost" : "Found"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryChip, category === c && styles.categoryChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text
                style={[styles.categoryText, category === c && styles.categoryTextActive]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FC", padding: 20 },

  header: { fontSize: 26, fontWeight: "700", color: "#222", marginBottom: 4 },
  subheader: { color: "#666", marginBottom: 20 },

  imagePicker: {
    backgroundColor: "#fff",
    height: 180,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    marginBottom: 20,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  imageText: { color: "#666", marginTop: 8, fontWeight: "500" },

  formCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    elevation: 3,
    marginBottom: 20,
  },

  label: { fontWeight: "600", color: "#333", marginTop: 12 },
  input: {
    backgroundColor: "#F1F3F6",
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
    fontSize: 15,
    color: "#333",
  },

  statusRow: { flexDirection: "row", marginTop: 8 },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#EAECEF",
    marginRight: 10,
  },
  statusChipActive: { backgroundColor: COLORS.primary },
  statusText: { color: "#555" },
  statusTextActive: { color: "#fff" },

  categoryChip: {
    backgroundColor: "#F1F3F6",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    marginRight: 10,
    marginTop: 10,
  },
  categoryChipActive: { backgroundColor: COLORS.primary },
  categoryText: { color: "#444" },
  categoryTextActive: { color: "#fff" },

  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  submitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
