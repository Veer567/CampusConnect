// app/(your-path)/EditPostScreen.tsx
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
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
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
import dayjs from "dayjs";
import DateTimePicker from "react-native-ui-datepicker";

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
  const { postId } = useLocalSearchParams<{ postId?: string }>();

  const posts = useQuery(api.posts.getPostsByUser, { userId: undefined });
  const post = posts?.find((p) => p._id === postId);

  const editPost = useMutation(api.posts.editPost);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // ▼ NEW: Date Picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPickerDate, setSelectedPickerDate] = useState(new Date());
  const slideAnim = useRef(new Animated.Value(0)).current;

  // animations
  const categoryScales = useMemo(
    () => categories.map(() => new Animated.Value(1)),
    []
  );
  const fabScale = useRef(new Animated.Value(1)).current;

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
        toValue: 1.08,
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

  // 📸 Pick Image
  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn("Image pick error:", err);
    }
  }, []);

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#+/, "").toLowerCase();
    if (!clean) return;
    if (!tags.includes(clean)) setTags((s) => [...s, clean]);
    setTagInput("");
  };

  // ▼ NEW: Open date picker slider
  const openDatePicker = () => {
    try {
      if (eventDate) {
        const parsed = dayjs(eventDate, "DD/MM/YYYY").toDate();
        if (!isNaN(parsed.getTime())) {
          setSelectedPickerDate(parsed);
        }
      }
    } catch {}

    setShowDatePicker(true);
    slideAnim.setValue(0);

    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closePicker = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowDatePicker(false));
  };

  // SAVE
  const handleSave = useCallback(async () => {
    if (isUpdating || !post) return;

    if (!title.trim()) {
      Toast.show({ type: "error", text1: "Title required" });
      return;
    }
    if (!caption.trim()) {
      Toast.show({ type: "error", text1: "Description required" });
      return;
    }

    setIsUpdating(true);
    animateFab();

    let finalStorageId: string | null = null;

    try {
      if (selectedImage && selectedImage.startsWith("file:")) {
        const uploadUrl = await generateUploadUrl();

        // support both string and object responses safely
        let actualUploadUrl: string | null = null;
        if (typeof uploadUrl === "string") {
          actualUploadUrl = uploadUrl;
        } else if (
          uploadUrl &&
          typeof uploadUrl === "object" &&
          "uploadUrl" in uploadUrl &&
          typeof (uploadUrl as any).uploadUrl === "string"
        ) {
          actualUploadUrl = (uploadUrl as any).uploadUrl;
        } else {
          throw new Error("Invalid upload URL received from server");
        }

        if (!actualUploadUrl) {
          throw new Error("Upload URL is null or undefined");
        }

        const result = await FileSystem.uploadAsync(
          actualUploadUrl,
          selectedImage,
          {
            httpMethod: "POST",
            mimeType: "image/jpeg",
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          }
        );

        finalStorageId = JSON.parse(result.body)?.storageId ?? null;
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

      Toast.show({ type: "success", text1: "Post updated!" });
      setTimeout(() => router.back(), 350);
    } catch (err) {
      console.error(err);
      Toast.show({ type: "error", text1: "Failed to update" });
    } finally {
      setIsUpdating(false);
    }
  }, [
    title,
    caption,
    selectedCategory,
    location,
    eventDate,
    selectedImage,
    tags,
    isUpdating,
    editPost,
    generateUploadUrl,
    post,
  ]);

  if (!post) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.surface,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
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
        <AppHeader title="Edit Post" showBackButton onBackPress={() => router.back()} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { minHeight: height * 0.78 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Categories */}
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat, i) => {
                const active = selectedCategory?.id === cat.id;
                return (
                  <Animated.View
                    key={cat.id}
                    style={{ transform: [{ scale: categoryScales[i] }], marginRight: 8 }}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.85}
                      style={[
                        styles.categoryButton,
                        active && styles.categoryButtonActive,
                      ]}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text
                        style={
                          active ? styles.categoryTextActive : styles.categoryText
                        }
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
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

              {/* ▼ DATE INPUT WITH INLINE ICON */}
              <TouchableOpacity
                onPress={openDatePicker}
                activeOpacity={0.85}
                style={[
                  styles.input,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                ]}
              >
                <Text style={{ color: eventDate ? "#000" : "#777" }}>
                  {eventDate || "Select Event Date (DD/MM/YYYY)"}
                </Text>

                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* ▼ TAGS */}
            <Text style={styles.label}>Tags (#)</Text>
            <View style={{ marginTop: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#E6E9EE",
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  alignItems: "center",
                }}
              >
                <TextInput
                  placeholder="Add tag..."
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  style={{
                    flex: 1,
                    paddingVertical: Platform.OS === "ios" ? 12 : 8,
                  }}
                />

                <TouchableOpacity onPress={handleAddTag}>
                  <Ionicons name="add-circle" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 10 }}
              >
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
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
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

            {/* IMAGE */}
            <Text style={styles.label}>Event Image</Text>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={pickImage}
              activeOpacity={0.9}
            >
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
                  <Text style={styles.placeholderText}>Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* SAVE BUTTON */}
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
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons name="save" size={26} color="#fff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>

        {/* ▼ DATE PICKER MODAL */}
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Animated.View
              style={{
                width: "90%",
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 15,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [200, 0],
                    }),
                  },
                ],
                opacity: slideAnim,
                elevation: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                Choose Event Date
              </Text>

              <DateTimePicker
                mode="single"
                date={selectedPickerDate}
                onChange={(params) => {
                  if (!params.date) return;

                  const dateObj =
                    params.date instanceof Date
                      ? params.date
                      : dayjs(params.date).toDate();

                  setSelectedPickerDate(dateObj);
                  setEventDate(dayjs(dateObj).format("DD/MM/YYYY"));
                  closePicker();
                }}
              />

              <TouchableOpacity
                onPress={closePicker}
                style={{
                  marginTop: 10,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: COLORS.primary, fontSize: 16 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}
