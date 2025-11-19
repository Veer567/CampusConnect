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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditLostItem() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Load existing item
  const item = useQuery(
    api.lostItems.getItemById,
    id ? { id: id as any } : "skip"
  );

  const updateLostItem = useMutation(api.lostItems.updateLostItem);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Other");

  // ❗ status must always be: "lost" | "found"
  const [status, setStatus] = useState<"lost" | "found">("lost");

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Load item into form
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || "");
      setLocation(item.location || "");
      setCategory(item.category || "Other");

      // FIX: Explicit cast to union type
      setStatus(item.status as "lost" | "found");

      setImageUrl(item.imageUrl || null);
    }
  }, [item]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a valid title.");
      return;
    }

    try {
      await updateLostItem({
        id: id as any,
        title,
        description,
        location,
        category,
        status, // already correct type
        imageUrl: imageUrl || undefined,
      });

      Alert.alert("Updated!", "Your item was successfully updated.");
      router.replace("/lost-found");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Update failed");
    }
  };

  if (!item)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit Lost & Found Item</Text>

      {/* Title */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Item title"
        value={title}
        onChangeText={setTitle}
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Describe your item"
        value={description}
        multiline
        onChangeText={setDescription}
      />

      {/* Location */}
      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Where was it lost or found?"
        value={location}
        onChangeText={setLocation}
      />

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {["Electronics", "Books", "Accessories", "Other"].map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={[
              styles.chip,
              category === c && { backgroundColor: COLORS.primary },
            ]}
          >
            <Text
              style={[styles.chipText, category === c && { color: "white" }]}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Status */}
      <Text style={styles.label}>Status</Text>
      <View style={{ flexDirection: "row" }}>
        {(["lost", "found"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)} // now correct type
            style={[
              styles.chip,
              status === s && { backgroundColor: COLORS.primary },
            ]}
          >
            <Text style={[styles.chipText, status === s && { color: "white" }]}>
              {s.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Image */}
      <Text style={styles.label}>Image</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <Ionicons name="image-outline" size={40} color="#444" />
        )}
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    color: "#222",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#eee",
    marginRight: 10,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  imagePicker: {
    height: 180,
    backgroundColor: "#eee",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 20,
    marginTop: 6,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
  },
});
