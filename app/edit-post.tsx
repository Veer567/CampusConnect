// app/(your-path)/EditPostScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/themes";
import { styles } from "@/styles/create.styles";

import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import AppHeader from "@/components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

const { height, width } = Dimensions.get("window");

const categories = [
  { id: 1, name: "Placements", icon: "👨‍💼" },
  { id: 2, name: "Workshops", icon: "🛠️" },
  { id: 3, name: "Hackathon", icon: "🚀" },
  { id: 4, name: "Festivals", icon: "🎉" },
  { id: 5, name: "Sports", icon: "🏅" },
  { id: 6, name: "Other", icon: "✨" },
];

export default function EditPostScreen() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();

  // fetch user's posts (Convex limitation)
  const posts = useQuery(api.posts.getPostsByUser, { userId: undefined });
  const post = posts?.find((p) => p._id === postId);

  const editPost = useMutation(api.posts.editPost);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

  // states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // animations
  const categoryScales = useMemo(
    () => categories.map(() => new Animated.Value(1)),
    []
  );
  const fabScale = useRef(new Animated.Value(1)).current;

  // load existing post into state
  useEffect(() => {
    if (!post) return;
    setSelectedImage(post.imageUrl || null);
    setTitle(post.title || "");
    setCaption(post.caption || "");
    setLocation(post.location || "");
    setEventDate(post.eventDate || "");
    setTags(post.tags || []);
    const found = categories.find((c) => c.name === post.category);
    setSelectedCategory(found || categories[categories.length - 1]);
  }, [post]);

  // animate category scales on selection change
  useEffect(() => {
    categories.forEach((cat, i) => {
      Animated.spring(categoryScales[i], {
        toValue: selectedCategory?.id === cat.id ? 1.08 : 1,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedCategory]);

  const animateFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 1.08, duration: 120, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  // image picker (square)
  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn("Image pick error:", err);
    }
  }, []);

  // tag helpers
  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#+/, "").toLowerCase();
    if (!clean) return;
    if (!tags.includes(clean)) setTags((s) => [...s, clean]);
    setTagInput("");
  };

  // save post
  const handleSave = useCallback(async () => {
    if (isUpdating || !post) return;

    setIsUpdating(true);
    animateFab();

    let finalStorageId: string | null = null;

    try {
      // Upload local file if user changed the image to a file:// URI
      if (selectedImage && selectedImage.startsWith("file:")) {
        const uploadUrl = await generateUploadUrl();
        // if API returns a string or object, handle both
        const actualUploadUrl =
          typeof uploadUrl === "string" ? uploadUrl : ((uploadUrl as any)?.uploadUrl ?? (uploadUrl as any));

        const result = await FileSystem.uploadAsync(String(actualUploadUrl), selectedImage, {
          httpMethod: "POST",
          mimeType: "image/jpeg",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        });

        // server expected response { storageId }
        try {
          const parsed = JSON.parse(result.body || "{}");
          finalStorageId = parsed.storageId ?? parsed.storage_id ?? null;
        } catch (e) {
          // ignore parse errors
          finalStorageId = null;
        }
      }

      await editPost({
        postId: post._id,
        title,
        caption,
        category: selectedCategory?.name || "Other",
        location,
        eventDate,
        tags,
        ...(finalStorageId ? { storageId: finalStorageId } : {}),
      });

      Toast.show({ type: "success", text1: "Post updated!", position: "bottom" });
      // small delay to let user see toast
      setTimeout(() => router.back(), 300);
    } catch (err) {
      console.error("Edit post error:", err);
      Toast.show({ type: "error", text1: "Update failed", text2: "Please try again", position: "bottom" });
    } finally {
      setIsUpdating(false);
    }
  }, [
    title,
    caption,
    location,
    eventDate,
    selectedImage,
    tags,
    selectedCategory,
    editPost,
    generateUploadUrl,
    isUpdating,
    post,
  ]);

  if (!post) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.surface }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <LinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <AppHeader title="Edit Post" showBackButton onBackPress={() => router.back()} />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
          <ScrollView contentContainerStyle={[styles.scrollContent, { minHeight: height * 0.78 }]} showsVerticalScrollIndicator={false}>
            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map((cat, i) => {
                const active = selectedCategory?.id === cat.id;
                return (
                  <Animated.View key={cat.id} style={{ transform: [{ scale: categoryScales[i] }], marginRight: 8 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.85}
                      style={[styles.categoryButton, active && styles.categoryButtonActive]}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text style={active ? styles.categoryTextActive : styles.categoryText}>{cat.name}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>

            {/* Event Details */}
            <Text style={styles.label}>Event Details</Text>
            <View style={styles.card}>
              <TextInput placeholder="Event Title" value={title} onChangeText={setTitle} style={styles.input} />
              <TextInput placeholder="Description" value={caption} onChangeText={setCaption} style={[styles.input, styles.inputMultiline]} multiline />
              <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={styles.input} />
              <TextInput placeholder="Date (YYYY-MM-DD)" value={eventDate} onChangeText={setEventDate} style={styles.input} />
            </View>

            {/* Tags */}
            <Text style={styles.label}>Tags (#)</Text>
            <View style={{ marginTop: 6 }}>
              <View style={{ flexDirection: "row", borderWidth: 1, borderColor: "#E6E9EE", borderRadius: 10, paddingHorizontal: 10, alignItems: "center" }}>
                <TextInput
                  placeholder="Add tag..."
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  style={{ flex: 1, paddingVertical: Platform.OS === "ios" ? 12 : 8 }}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleAddTag} style={{ paddingLeft: 8 }}>
                  <Ionicons name="add-circle" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setTags((s) => s.filter((t) => t !== tag))}
                    style={{
                      backgroundColor: COLORS.secondary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      marginRight: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>#{tag}</Text>
                    <Ionicons name="close-circle" size={16} color="white" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Image */}
            <Text style={styles.label}>Event Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.9}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.image} contentFit="cover" />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="image-outline" size={48} color={COLORS.textSecondary} />
                  <Text style={styles.placeholderText}>Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Save FAB */}
          <View style={styles.fabContainer}>
            <Animated.View style={{ transform: [{ scale: fabScale }] }}>
              <TouchableOpacity disabled={isUpdating} onPress={handleSave} style={[styles.fab, isUpdating && styles.fabDisabled]}>
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.fabGradient}>
                  {isUpdating ? <ActivityIndicator color="#fff" /> : <Ionicons name="save" size={26} color="#fff" />}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
