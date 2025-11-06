import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/themes";
import { styles } from "@/styles/create.styles";
import { api } from "@/convex/_generated/api";
import { StatusBar } from "expo-status-bar";
import AppHeader from "@/components/AppHeader";

const { height } = Dimensions.get("window");

type Category = { id: number; name: string; icon: string };

const categories: Category[] = [
  { id: 1, name: "Placements", icon: "👨‍💼" },
  { id: 2, name: "Workshops", icon: "🛠️" },
  { id: 3, name: "Hackathon", icon: "🚀" },
  { id: 4, name: "Festivals", icon: "🎉" },
  { id: 5, name: "Sports", icon: "🏅" },
  { id: 6, name: "Other", icon: "✨" },
];

export default function CreateScreen() {
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");

  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost);

  const isFormValid = useMemo(
    () => !!selectedImage && !!title && !!description,
    [selectedImage, title, description]
  );

  const categoryScales = useMemo(
    () => categories.map(() => new Animated.Value(1)),
    []
  );
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    categories.forEach((cat, index) => {
      Animated.spring(categoryScales[index], {
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

const handleShare = useCallback(async () => {
  if (!isFormValid || isSharing) return;
  animateFab();

  // Keep a copy of the selected image for background upload
  const prevImage = selectedImage;

  // Instantly clear the form for smooth UX
  setTitle("");
  setDescription("");
  setLocation("");
  setEventDate("");
  setSelectedCategory(null);
  setSelectedImage(null);

  // Instantly navigate to the main feed screen (index)
  router.replace("/(tabs)"); // instantly switch to index tab

  // Continue uploading and creating post in the background
  try {
    const uploadUrl = await generateUploadUrl();

    const uploadResult = await FileSystem.uploadAsync(uploadUrl, prevImage!, {
      httpMethod: "POST",
      mimeType: "image/jpeg",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    if (uploadResult.status !== 200) throw new Error("Upload failed");

    const { storageId } = JSON.parse(uploadResult.body);

    await createPost({
      storageId,
      caption: description,
      category: selectedCategory?.name || "Other",
      title,
      location,
      eventDate,
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



  return (
    <LinearGradient
      colors={["#EFF6FF", "#FFFFFF"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor={COLORS.primary} />

        <AppHeader title="Create Post" showBackButton onBackPress={() => router.back()} />

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

            {/* Inputs */}
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

            {/* Image Picker */}
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

          {/* Floating Button */}
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
  );
}
