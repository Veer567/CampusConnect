// Import necessary dependencies and components
import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/create.styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "convex/react";

import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "react-native-ui-datepicker";

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
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

// Custom Alert Component
import CustomAlert from "@/components/GlobalAlert";
import { useToast } from "@/components/Toast/ToastProvider";

const { height } = Dimensions.get("window");

type Category = { id: number; name: string; icon: React.JSX.Element };

export const categories = [

  {
    id: 1,
    name: "Placements",
    icon: <Ionicons name="briefcase" size={24} color="#FF914D" />, // orange
  },
  {
    id: 2,
    name: "Workshops",
    icon: (
      <MaterialCommunityIcons name="hammer-wrench" size={24} color="#00BFA6" />
    ), // teal
  },
  {
    id: 3,
    name: "Hackathon",
    icon: <Ionicons name="rocket" size={24} color="#FF4F79" />, // pink-red
  },
  {
    id: 4,
    name: "Festivals",
    icon: <Ionicons name="sparkles" size={24} color="#FFD233" />, // gold
  },
  {
    id: 5,
    name: "Sports",
    icon: <Ionicons name="trophy" size={24} color="#2EC4B6" />, // green-teal
  },
  {
    id: 6,
    name: "Other",
    icon: <Ionicons name="ellipsis-horizontal" size={24} color="#8E44AD" />, // purple dark
  },
];

export default function CreateScreen() {
  const router = useRouter();

  const toast = useToast();

  // Form Data
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // Date picker
  const [eventDate, setEventDate] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [selected, setSelected] = useState(new Date());

  const slideAnim = useRef(new Animated.Value(0)).current;

  const openPickerAnimated = () => {
    setShowPicker(true);
    slideAnim.setValue(0);

    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closePicker = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowPicker(false));
  };

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

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

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
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pickImage = useCallback(async () => {
    if (isSharing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }, [isSharing]);

  const handleShare = useCallback(async () => {
    if (!selectedCategory)
      return toast.show(
        { title: "Missing Category", message: "Please select a category." },
        "error"
      );

    if (!title.trim())
      return toast.show(
        {
          title: "Event Title Missing",
          message: "Please enter the event title.",
        },
        "error"
      );

    if (!description.trim())
      return toast.show(
        { title: "Description Missing", message: "Add a description." },
        "error"
      );

    if (!location.trim())
      return toast.show(
        { title: "Location Missing", message: "Please enter event location." },
        "error"
      );

    if (!selectedImage)
      return toast.show(
        { title: "Image Missing", message: "Please upload an event image." },
        "error"
      );

    if (isSharing) return;

    animateFab();
    setIsSharing(true);

    try {
      const uploadUrl = await generateUploadUrl();
      const uploadResult = await FileSystem.uploadAsync(
        uploadUrl,
        selectedImage!,
        {
          httpMethod: "POST",
          mimeType: "image/jpeg",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        }
      );

      if (uploadResult.status !== 200) throw new Error("Upload failed");

      const { storageId } = JSON.parse(uploadResult.body);

      await createPost({
        storageId,
        caption: description,
        category: selectedCategory.name,
        title,
        location,
        eventDate,
        tags: tags.map((t) => t.toLowerCase()),
      });

      toast.show(
        {
          title: "Post Created 🎉",
          message: "Your event has been shared successfully!",
        },
        "success"
      );

      router.replace("/(tabs)");
    } catch (error) {
      toast.show(
        { title: "Error", message: "Unable to share post. Try again." },
        "error"
      );
    }

    setIsSharing(false);
  }, [
    selectedCategory,
    title,
    description,
    location,
    eventDate,
    selectedImage,
    tags,
    isSharing,
    generateUploadUrl,
    createPost,
    router,
  ]);

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const formatted = tagInput.trim().toLowerCase();

    if (!tags.includes(formatted)) setTags([...tags, formatted]);

    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const AlertComponent = CustomAlert as React.ComponentType<any>;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <LinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container} edges={[]}>
          <AppHeader
            title="Create Post"
            showBackButton
            onBackPress={() => router.back()}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.content}
          >
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { minHeight: height * 0.9 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* CATEGORY SELECTION */}
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

              {/* EVENT DETAILS */}
              <Text style={styles.label}>Event Details</Text>
              <View style={styles.card}>
                <TextInput
                  placeholder="Event Title"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor={COLORS.grey}
                  style={styles.input}
                />

                <TextInput
                  placeholder="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor={COLORS.grey}
                  style={[styles.input, styles.inputMultiline]}
                  multiline
                />

                <TextInput
                  placeholder="Location"
                  value={location}
                  onChangeText={setLocation}
                  placeholderTextColor={COLORS.grey}
                  style={styles.input}
                />

                {/* DATE FIELD */}
                <TouchableOpacity
                  onPress={openPickerAnimated}
                  style={[
                    styles.input,
                    { flexDirection: "row", alignItems: "center" },
                  ]}
                >
                  <Text style={{ flex: 1, color: eventDate ? "#000" : "#777" }}>
                    {eventDate || "Select Event Date (DD/MM/YYYY)"}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* DATE PICKER MODAL */}
              <Modal visible={showPicker} transparent animationType="fade">
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
                      Select Event Date
                    </Text>

                    <DateTimePicker
                      mode="single"
                      date={selected}
                      onChange={(params: { date: any; }) => {
                        if (!params.date) return;

                        const dateObj =
                          params.date instanceof Date
                            ? params.date
                            : dayjs(params.date).toDate();

                        setSelected(dateObj);
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

              {/* TAGS */}
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
                    placeholder="Add tags..."
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholderTextColor={COLORS.grey}
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

              {/* IMAGE PICKER */}
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

            {/* SHARE FAB */}
            <View style={styles.fabContainer}>
              <Animated.View style={{ transform: [{ scale: fabScale }] }}>
                <TouchableOpacity
                  disabled={isSharing}
                  onPress={handleShare}
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
