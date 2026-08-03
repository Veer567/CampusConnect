// app/lost-found/edit.tsx
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useToast } from "@/components/Toast/ToastProvider";
import { SafeAreaView } from "react-native-safe-area-context";

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

import { useNavigation, useRoute } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;


export default function EditLostItem() {
  // ⭐ FIXED: Now inside component, not global
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { id } = route.params as { id: string };
  const toast = useToast();

  // ITEM QUERY
  const item = useQuery(
    api.lostItems.getLostItemById,
    id ? { id: id as any } : "skip"
  );

  const updateLostItem = useMutation(api.lostItems.updateLostItem);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

  // FORM STATES
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"lost" | "found">("lost");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // LOAD EXISTING ITEM
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || "");
      setLocation(item.location || "");
      setStatus(item.status as "lost" | "found");
      setImageUrl(item.imageUrl || null);
    }
  }, [item]);

  // IMAGE PICKER
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) setImageUrl(result.assets[0].uri);
  };

  const uploadImageToConvex = async (uri: string) => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uri);
    const blob = await res.blob();
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": blob.type,
      },
      body: blob,
    });
    if (!uploadRes.ok) throw new Error("Image upload failed");
    const { storageId } = await uploadRes.json();
    return storageId;
  };

  // SUBMIT
  const handleSubmit = async () => {
    try {
      let imageStorageId: string | undefined = undefined;

      // Only upload if it's a new local image
      if (imageUrl && imageUrl !== item?.imageUrl) {
        imageStorageId = await uploadImageToConvex(imageUrl);
      }

      await updateLostItem({
        id: id as any,
        title,
        description,
        location,
        status,
        category: undefined,
        imageStorageId: imageStorageId as any,
      });

      toast.show({ type: "success", message: "Your item was successfully updated." });
      navigation.goBack(); // ⭐ FIXED
    } catch (err: any) {
      toast.show({ type: "error", message: err.message || "Update failed" });
    }
  };

  // LOADING SCREEN
  if (!item)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  // UI
  return (
     <View style={{ flex: 1, backgroundColor: COLORS.background  , marginTop: -50}}>
       <SafeAreaView style={{ flex: 1 }}>
         {/* Header / Back */}
   
         <KeyboardAvoidingView
           behavior={Platform.OS === "ios" ? "padding" : "height"}
           style={{ flex: 1 }}
         >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Edit Item</Text>

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
              style={[styles.chip, status === s && styles.chipActive]}
              onPress={() => setStatus(s as "lost" | "found")}
            >
              <Text
                style={[styles.chipText, status === s && { color: "#fff" }]}
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
      </SafeAreaView>
    </View>
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
    paddingBottom: wp(2),
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
