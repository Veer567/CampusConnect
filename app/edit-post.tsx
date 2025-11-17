import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const { height } = Dimensions.get("window");

const categories = [
  { id: 1, name: "Placements", icon: "👨‍💼" },
  { id: 2, name: "Workshops", icon: "🛠️" },
  { id: 3, name: "Hackathon", icon: "🚀" },
  { id: 4, name: "Festivals", icon: "🎉" },
  { id: 5, name: "Sports", icon: "🏅" },
  { id: 6, name: "Other", icon: "✨" },
];

export default function EditPostScreen() {
  const { postId } = useLocalSearchParams();

  // Fetch all posts (Convex limitation: no single post read)
  const posts = useQuery(api.posts.getPostsByUser, { userId: undefined });
  const post = posts?.find((p) => p._id === postId);

  const editPost = useMutation(api.posts.editPost);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

  // LOCAL STATES
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Animation
  const categoryScales = useMemo(
    () => categories.map(() => new Animated.Value(1)),
    []
  );
  const fabScale = useRef(new Animated.Value(1)).current;

  // Load existing post
  useEffect(() => {
    if (post) {
      setSelectedImage(post.imageUrl || null);
      setTitle(post.title || "");
      setCaption(post.caption || "");
      setLocation(post.location || "");
      setEventDate(post.eventDate || "");
      setTags(post.tags || []);

      const cat = categories.find((c) => c.name === post.category);
      setSelectedCategory(cat || categories[5]);
    }
  }, [post]);

  useEffect(() => {
    categories.forEach((cat, i) => {
      Animated.spring(categoryScales[i], {
        toValue: selectedCategory?.id === cat.id ? 1.1 : 1,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedCategory]);

  const animateFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 1.1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Pick image
  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  // Add Tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace("#", "").toLowerCase();
    if (!tags.includes(clean)) setTags([...tags, clean]);
    setTagInput("");
  };

  // Save Changes
  const handleSave = useCallback(async () => {
    if (isUpdating || !post) return;

    setIsUpdating(true);
    animateFab();

    let finalStorageId = null;

    try {
      // If user changed image (local URI)

      if (selectedImage && selectedImage.startsWith("file:/")) {
        const uploadUrl = await generateUploadUrl();

        const result = await FileSystem.uploadAsync(uploadUrl, selectedImage, {
          httpMethod: "POST",
          mimeType: "image/jpeg",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        });

        const { storageId } = JSON.parse(result.body);
        finalStorageId = storageId;
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

      Toast.show({
        type: "success",
        text1: "Post updated!",
        position: "bottom",
      });

      router.back();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2:  "Please try again",
        position: "bottom",
      });
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
  ]);

  if (!post) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <LinearGradient
        colors={["#EFF6FF", "#FFFFFF"]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AppHeader title="Edit Post" showBackButton onBackPress={router.back} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { minHeight: height * 0.8 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat, i) => (
                <Animated.View
                  key={cat.id}
                  style={{ transform: [{ scale: categoryScales[i] }] }}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      selectedCategory?.id === cat.id &&
                        styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text
                      style={
                        selectedCategory?.id === cat.id
                          ? styles.categoryTextActive
                          : styles.categoryText
                      }
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>

            {/* Event Details */}
            <Text style={styles.label}>Event Details</Text>
            <View style={styles.card}>
              <TextInput
                placeholder="Event Title"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
              <TextInput
                placeholder="Description"
                value={caption}
                onChangeText={setCaption}
                style={[styles.input, styles.inputMultiline]}
                multiline
              />
              <TextInput
                placeholder="Location"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
              />
              <TextInput
                placeholder="Date (YYYY-MM-DD)"
                value={eventDate}
                onChangeText={setEventDate}
                style={styles.input}
              />
            </View>

            {/* Tags */}
            <Text style={styles.label}>Tags (#)</Text>

            <View>
              <View
                style={{
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 10,
                  paddingHorizontal: 10,
                }}
              >
                <TextInput
                  placeholder="Add tag..."
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  style={{ flex: 1, paddingVertical: 10 }}
                />
                <TouchableOpacity onPress={handleAddTag}>
                  <Ionicons
                    name="add-circle"
                    size={22}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() =>
                      setTags(tags.filter((t) => t !== tag))
                    }
                    style={{
                      backgroundColor: COLORS.secondary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      marginTop: 10,
                      marginRight: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                      #{tag}
                    </Text>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color="white"
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Image */}
            <Text style={styles.label}>Event Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.image}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons
                    name="image-outline"
                    size={48}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.placeholderText}>
                    Tap to select image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Save FAB */}
          <View style={styles.fabContainer}>
            <Animated.View style={{ transform: [{ scale: fabScale }] }}>
              <TouchableOpacity
                disabled={isUpdating}
                onPress={handleSave}
                style={[styles.fab, isUpdating && styles.fabDisabled]}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.fabGradient}
                >
                  {isUpdating ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Ionicons name="save" size={26} color={COLORS.white} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
