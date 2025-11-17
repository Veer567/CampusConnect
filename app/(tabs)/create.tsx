// Import necessary dependencies and components
import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Get screen height for layout responsiveness
const { height } = Dimensions.get("window");

// Define category type and list of categories with emoji icons
type Category = { id: number; name: string; icon: string };

const categories: Category[] = [
  { id: 1, name: "Placements", icon: "👨‍💼" },
  { id: 2, name: "Workshops", icon: "🛠️" },
  { id: 3, name: "Hackathon", icon: "🚀" },
  { id: 4, name: "Festivals", icon: "🎉" },
  { id: 5, name: "Sports", icon: "🏅" },
  { id: 6, name: "Other", icon: "✨" },
];

// Main Create Post screen
export default function CreateScreen() {
  const router = useRouter();

  // State variables for form inputs and UI state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Convex backend mutations for upload and post creation
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost);

  // Form validation to enable the submit button only when fields are filled
  const isFormValid = useMemo(
    () => !!selectedImage && !!title && !!description,
    [selectedImage, title, description]
  );

  // Animated scale values for category buttons and floating action button (FAB)
  const categoryScales = useMemo(
    () => categories.map(() => new Animated.Value(1)),
    []
  );
  const fabScale = useRef(new Animated.Value(1)).current;

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Animate category selection for visual feedback
  useEffect(() => {
    categories.forEach((cat, index) => {
      Animated.spring(categoryScales[index], {
        toValue: selectedCategory?.id === cat.id ? 1.1 : 1,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedCategory]);

  // Floating action button click animation
  const animateFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 1.1,
        duration: 120,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Open image picker to choose event image
  const pickImage = useCallback(async () => {
    if (isSharing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }, [isSharing]);

  // Handles background post creation and upload
  const handleShare = useCallback(async () => {
    if (!isFormValid || isSharing) return;
    animateFab();

    // Keep reference to selected image for async upload
    const prevImage = selectedImage;

    // Instantly clear the form for smoother user experience
    setTitle("");
    setDescription("");
    setLocation("");
    setEventDate("");
    setSelectedCategory(null);
    setSelectedImage(null);

    // Navigate back to feed instantly for non-blocking UX
    router.replace("/(tabs)");

    // Perform image upload and post creation in background
    try {
      const uploadUrl = await generateUploadUrl();

      const uploadResult = await FileSystem.uploadAsync(uploadUrl, prevImage!, {
        httpMethod: "POST",
        mimeType: "image/jpeg",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      if (uploadResult.status !== 200) throw new Error("Upload failed");

      const { storageId } = JSON.parse(uploadResult.body);

      // Save post details in the database
      await createPost({
        storageId,
        caption: description,
        category: selectedCategory?.name || "Other",
        title,
        location,
        eventDate,
        tags: tags.map((t) => t.toLowerCase()),
      });
    } catch (error) {
      console.error("Error sharing post:", error);
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

  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    const formatted = tagInput.trim().toLowerCase();

    if (tags.includes(formatted)) return;

    setTags([...tags, formatted]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Screen UI layout
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      {/* Gradient background for better aesthetics */}
      <LinearGradient
        colors={["#EFF6FF", "#FFFFFF"]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          {/* Top header with back button */}
          <AppHeader
            title="Create Post"
            showBackButton
            onBackPress={() => router.back()}
          />

          {/* Handle keyboard behavior for input fields */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.content}
          >
            {/* Scrollable form section */}
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { minHeight: height * 0.8 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Category Selection Section */}
              <Text style={styles.label}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {categories.map((cat, index) => (
                  <Animated.View
                    key={cat.id}
                    style={{ transform: [{ scale: categoryScales[index] }] }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.categoryButton,
                        selectedCategory?.id === cat.id &&
                          styles.categoryButtonActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.85}
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

              {/* Event Details Input Fields */}
              <Text style={styles.label}>Event Details</Text>
              <View style={styles.card}>
                <TextInput
                  placeholder="Event Title"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                  placeholderTextColor={COLORS.textSecondary}
                />
                <TextInput
                  placeholder="Description"
                  value={description}
                  onChangeText={setDescription}
                  style={[styles.input, styles.inputMultiline]}
                  multiline
                  placeholderTextColor={COLORS.textSecondary}
                />
                <TextInput
                  placeholder="Location"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                  placeholderTextColor={COLORS.textSecondary}
                />
                <TextInput
                  placeholder="Date (YYYY-MM-DD)"
                  value={eventDate}
                  onChangeText={setEventDate}
                  style={styles.input}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <Text style={styles.label}>Tags (#)</Text>

              <View style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    alignItems: "center",
                  }}
                >
                  <TextInput
                    placeholder="Add tags (press enter)..."
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

                {/* Render tags */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                >
                  {tags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => removeTag(tag)}
                      style={{
                        backgroundColor: COLORS.secondary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
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

              {/* Image Picker Section */}
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

            {/* Floating Action Button (FAB) for submission */}
            <View style={styles.fabContainer}>
              <Animated.View style={{ transform: [{ scale: fabScale }] }}>
                <TouchableOpacity
                  disabled={!isFormValid || isSharing}
                  onPress={handleShare}
                  activeOpacity={0.85}
                  style={[styles.fab, !isFormValid && styles.fabDisabled]}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.fabGradient}
                  >
                    {isSharing ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Ionicons name="send" size={26} color={COLORS.white} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
