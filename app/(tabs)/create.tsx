import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";

// --- Types and Constants ---
type Category = { id: number; name: string; icon: string };

const categories: Category[] = [
  { id: 1, name: "Placements", icon: "👨‍💼" },
  { id: 2, name: "Workshops", icon: "🛠️" },
  { id: 3, name: "Hackathon", icon: "🚀" },
  { id: 4, name: "Festivals", icon: "🎉" },
  { id: 5, name: "Sports", icon: "🏅" },
  { id: 6, name: "Other", icon: "✨" },
];

// --- Main Component ---
export default function CreateScreen() {
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");

  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost);

  // --- Form validation ---
  const isFormValid = useMemo(() => !!selectedImage && !!title && !!description, [
    selectedImage,
    title,
    description,
  ]);

  // --- Animated scales for categories ---
  const categoryScales = useMemo(
    () => categories.map(() => new Animated.Value(1)),
    []
  );

  useEffect(() => {
    categories.forEach((cat, index) => {
      Animated.spring(categoryScales[index], {
        toValue: selectedCategory?.id === cat.id ? 1.1 : 1,
        useNativeDriver: true,
        speed: 25,
      }).start();
    });
  }, [selectedCategory, categoryScales]);

  // --- Image picker ---
  const pickImage = useCallback(async () => {
    if (isSharing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  }, [isSharing]);

  // --- Handle share ---
  const handleShare = useCallback(async () => {
    if (!isFormValid || isSharing) return;

    try {
      setIsSharing(true);

      const uploadUrl = await generateUploadUrl();
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, selectedImage!, {
        httpMethod: "POST",
        mimeType: "image/jpeg",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        fieldName: "file",
        headers: { "Content-Type": "image/jpeg" },
      });

      if (uploadResult.status !== 200) throw new Error("File upload failed");

      const { storageId } = JSON.parse(uploadResult.body);

      await createPost({
        storageId,
        caption: description,
        category: selectedCategory?.name || "Other",
        title,
        location,
        eventDate,
      });

      router.push("/(tabs)");
    } catch (error) {
      console.error("Error sharing post:", error);
    } finally {
      setIsSharing(false);
    }
  }, [
    isFormValid,
    isSharing,
    generateUploadUrl,
    selectedImage,
    createPost,
    description,
    selectedCategory,
    title,
    location,
    eventDate,
    router,
  ]);

  // --- Render input helper ---
  const renderInput = (
    placeholder: string,
    value: string,
    setValue: (text: string) => void,
    multiline = false,
    optional = false
  ) => (
    <TextInput
      placeholder={placeholder }
      placeholderTextColor={COLORS.grey}
      value={value}
      onChangeText={setValue}
      multiline={multiline}
      style={[styles.input, multiline && styles.multilineInput]}
      textAlignVertical={multiline ? "top" : "center"}
      editable={!isSharing}
    />
  );

  // --- UI ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <LinearGradient
            colors={[COLORS.surfaceLight, COLORS.surface]}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.headerContainer}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={isSharing}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={28} color={COLORS.blue} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Create Event Post</Text>

            <TouchableOpacity
              onPress={handleShare}
              disabled={isSharing || !isFormValid}
              style={styles.headerButton}
            >
              {isSharing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <LinearGradient
                  colors={
                    !isFormValid
                      ? [COLORS.grey, COLORS.blue]
                      : [COLORS.primary, COLORS.secondary]
                  }
                  start={[0, 0]}
                  end={[1, 1]}
                  style={styles.postButtonGradient}
                >
                  <Text style={styles.postButtonText}>Post</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </LinearGradient>

          {/* Category */}
          <Text style={styles.sectionTitle}>Select Event Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((cat, index) => (
              <Animated.View
                key={cat.id}
                style={{ transform: [{ scale: categoryScales[index] }], marginRight: 12 }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedCategory(cat)}
                  disabled={isSharing}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor:
                        selectedCategory?.id === cat.id
                          ? COLORS.primary
                          : COLORS.surfaceLight,
                    },
                  ]}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color:
                          selectedCategory?.id === cat.id
                            ? COLORS.white
                            : COLORS.grey,
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Inputs */}
          <Text style={styles.sectionTitle}> Details</Text>
          {renderInput(" Title", title, setTitle)}
          {renderInput("Description", description, setDescription, true)}
          {renderInput("Location", location, setLocation, false, true)}
          {renderInput("Date: (YYYY-MM-DD)", eventDate, setEventDate, false, true)}

          {/* Image Picker */}
          <Text style={styles.sectionTitle}> Image</Text>
          <TouchableOpacity
            onPress={pickImage}
            disabled={isSharing}
            style={styles.imagePicker}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <>
                <Ionicons name="image-outline" size={48} color={COLORS.grey} />
                <Text style={styles.imagePickerText}>Tap to select event image</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50 },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 16,
    marginBottom: 25,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.white,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 8 },
    }),
  },
  headerButton: { padding: 4 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "bold", letterSpacing: 0.5 },
  postButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  postButtonText: { color: COLORS.white, fontWeight: "600" },

  sectionTitle: { color: COLORS.white, fontSize: 16, fontWeight: "600", marginBottom: 10, marginTop: 10, opacity: 0.8 },

  categoryScroll: { marginBottom: 20 },
  categoryScrollContent: { paddingVertical: 4 },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    ...Platform.select({
      ios: { shadowColor: COLORS.background, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 3 },
      android: { elevation: 4 },
    }),
  },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryText: { fontWeight: "600" },

  input: {
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    minHeight: 50,
    color: COLORS.white,
    backgroundColor: COLORS.surface,
    fontSize: 16,
    ...Platform.select({
      ios: { shadowColor: COLORS.background, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
      android: { elevation: 4 },
    }),
  },
  multilineInput: { minHeight: 120, textAlignVertical: "top" },

  imagePicker: {
    height: 250,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.grey,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  selectedImage: { width: "100%", height: "100%", borderRadius: 20, borderWidth: 2, borderColor: COLORS.primary },
  imagePickerText: { color: COLORS.grey, marginTop: 8, fontSize: 14 },
});
