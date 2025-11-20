import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  BackHandler,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/themes";
import { api } from "../../../convex/_generated/api";

export default function EditMarketplace() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const post = useQuery(
    api.marketplace.getMarketplacePostById,
    id ? { id: id as any } : "skip"
  );

  const updatePost = useMutation(api.marketplace.updateMarketplacePost);
  const deletePost = useMutation(api.marketplace.deleteMarketplacePost);

  // ⭐ HOOKS MUST COME FIRST → NEVER DEPEND ON post
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [lastDateToJoin, setLastDateToJoin] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState("");

  // ⭐ When post loads → populate all fields
  useEffect(() => {
    if (!post) return;

    setTitle(post.title);
    setDescription(post.description);
    setTags((post.tags ?? []).join(", "));
    setLookingFor(post.lookingFor ?? "");
    setEventDate(post.eventDate ?? "");
    setLastDateToJoin(post.lastDateToJoin ?? "");
    setLocation(post.location ?? "");
    setImage(post.imageUrl ?? null);
  }, [post]);

  const postType = post?.type ?? "project";

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      router.replace(`/marketplace?tab=${postType}`);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => sub.remove();
  }, [postType]);

  // Pick Image
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

  // Submit Edited Post
  const submit = async () => {
    if (!post) return;
    if (!title.trim() || !description.trim()) {
      alert("Title and description are required.");
      return;
    }

    await updatePost({
      id: id as any,
      title,
      description,
      tags: tags.split(",").map((t) => t.trim()),
      lookingFor,
      eventDate,
      lastDateToJoin,
      imageUrl: image ?? undefined,
      location,
    });

    router.replace(`/marketplace?tab=${postType}`);
  };

  // Delete Post
  const deleteConfirm = () => {
    Alert.alert(
      "Delete Post?",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePost({ id: id as any });
            router.replace(`/marketplace?tab=${postType}`);
          },
        },
      ]
    );
  };

  // ⭐ SHOW LOADING WITHOUT BREAKING HOOK ORDER
  if (!post) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.replace(`/marketplace?tab=${postType}`)}
        style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}
      >
        <Ionicons name="arrow-back" size={26} color={COLORS.text} />
        <Text style={{ fontSize: 17, marginLeft: 6, color: COLORS.text }}>
          Back
        </Text>
      </TouchableOpacity>

      <Text style={styles.header}>Edit {postType.toUpperCase()}</Text>

      {/* Cover Image */}
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

      {/* Title */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="Enter title..."
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { minHeight: 120 }]}
        multiline
        placeholder="Description..."
      />

      {/* Tags */}
      <Text style={styles.label}>Skills & Tags</Text>
      <TextInput
        value={tags}
        onChangeText={setTags}
        style={styles.input}
        placeholder="React, UI Design..."
      />

      {/* Looking For */}
      <Text style={styles.label}>Looking For</Text>
      <TextInput
        value={lookingFor}
        onChangeText={setLookingFor}
        style={styles.input}
        placeholder="Backend dev, designer..."
      />

      {/* Dates */}
      <Text style={styles.label}>Event Date</Text>
      <TextInput
        value={eventDate}
        onChangeText={setEventDate}
        style={styles.input}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.label}>Last Date to Join</Text>
      <TextInput
        value={lastDateToJoin}
        onChangeText={setLastDateToJoin}
        style={styles.input}
        placeholder="YYYY-MM-DD"
      />

      {/* Location */}
      <Text style={styles.label}>Location</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        style={styles.input}
        placeholder="Mumbai, Delhi, Remote..."
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={submit}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.submitGradient}
        >
          <Text style={styles.submitText}>Save Changes</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteBtn} onPress={deleteConfirm}>
        <Text style={styles.deleteText}>Delete Post</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 160,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 18,
    color: COLORS.text,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14,
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
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  uploadText: { fontWeight: "700", color: COLORS.text },
  uploadSub: { color: COLORS.textSecondary, marginTop: 6 },
  previewImage: { width: "100%", height: 220, borderRadius: 12 },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  submitBtn: { marginTop: 24, borderRadius: 14, overflow: "hidden" },
  submitGradient: { padding: 16, borderRadius: 14, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  deleteBtn: {
    marginTop: 20,
    padding: 14,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteText: { color: "red", fontWeight: "700", fontSize: 15 },
});
