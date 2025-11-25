// CreateMarketplace.tsx
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  BackHandler,
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
  Alert,
} from "react-native";

import { COLORS } from "../../../constants/themes";
import { api } from "../../../convex/_generated/api";
import { Loader } from "@/components/Loader";

/* ---------------------------
   Responsive helpers (module scope)
   so styles can use wp/hp safely
----------------------------*/
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export default function CreateMarketplace() {
  const router = useRouter();
  const { type } = useLocalSearchParams();

  // typed — safe values only
  const validTypes = ["project", "hackathon", "startup"] as const;
  const initialType = validTypes.includes(type as any) ? (type as any) : "project";

  const [postType, setPostType] = useState<typeof validTypes[number]>(initialType);

  const createPost = useMutation(api.marketplace.createMarketplacePost);

  // form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [lastDateToJoin, setLastDateToJoin] = useState("");
  const [location, setLocation] = useState("Remote");
  const [image, setImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  /* ---------------------------------------------------------
     Request permissions and pick image + compress
  --------------------------------------------------------- */
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Please allow photo access to upload an image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        // compress and resize for faster uploads
        try {
          const compressed = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1080 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );
          setImage(compressed.uri);
        } catch (e) {
          // fallback to original if compression fails
          setImage(uri);
        }
      }
    } catch (err) {
      console.error("Image pick error", err);
    }
  };

  /* ---------------------------------------------------------
     Android back button override (cleanup included)
  --------------------------------------------------------- */
  useEffect(() => {
    const backAction = () => {
      router.replace(`/marketplace?tab=${postType}`);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => sub.remove();
  }, [postType, router]);

  /* ---------------------------------------------------------
     Submit Handler (optimized + robust)
  --------------------------------------------------------- */
  const submit = useCallback(async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing fields", "Please enter title and description.");
      return;
    }

    setLoading(true);

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await createPost({
        type: postType,
        title: title.trim(),
        description: description.trim(),
        tags: tagArray,
        lookingFor: lookingFor.trim() || undefined,
        eventDate: eventDate || undefined,
        lastDateToJoin: lastDateToJoin || undefined,
        location: location.trim() || "Remote",
        imageUrl: image || undefined,
      });

      // success: navigate back to marketplace tab
      router.replace(`/marketplace?tab=${postType}`);
    } catch (err) {
      console.error("Create marketplace post error:", err);
      Alert.alert("Failed", "Could not create post. Try again.");
    } finally {
      setLoading(false);
    }
  }, [
    title,
    description,
    tags,
    lookingFor,
    eventDate,
    lastDateToJoin,
    location,
    image,
    postType,
    createPost,
    router,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={hp(2)}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.replace(`/marketplace?tab=${postType}`)}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={26} color={COLORS.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.header}>
          Create {postType[0].toUpperCase() + postType.slice(1)}
        </Text>

        {/* Type Selector */}
        <View style={styles.typeRow}>
          {validTypes.map((t) => {
            const active = postType === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setPostType(t)}
                style={[styles.typeBtn, active && { backgroundColor: COLORS.primary }]}
                accessibilityRole="button"
              >
                <Text style={[styles.typeBtnText, active && { color: "#fff" }]}>
                  {t[0].toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Image */}
        <Text style={styles.label}>Cover Image</Text>
        <TouchableOpacity onPress={pickImage} style={styles.uploadBox} accessibilityRole="button">
          {!image ? (
            <>
              <Text style={styles.uploadText}>Upload Cover Image</Text>
              <Text style={styles.uploadSub}>Tap to select</Text>
            </>
          ) : (
            <Image source={{ uri: image }} style={styles.previewImage} />
          )}
        </TouchableOpacity>

        {/* Inputs */}
        <Input label="Title" value={title} onChange={setTitle} />
        <Input label="Description" value={description} onChange={setDescription} multiline />
        <Input label="Skills / Tags" value={tags} onChange={setTags} />
        <Input label="Looking For" value={lookingFor} onChange={setLookingFor} />
        <Input label="Event Date" value={eventDate} onChange={setEventDate} placeholder="YYYY-MM-DD" />
        <Input label="Last Date to Join" value={lastDateToJoin} onChange={setLastDateToJoin} placeholder="YYYY-MM-DD" />
        <Input label="Location" value={location} onChange={setLocation} />

        {/* Submit */}
        <TouchableOpacity
          disabled={loading}
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={submit}
          accessibilityRole="button"
        >
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.submitGradient}>
            <Text style={styles.submitText}>{loading ? <Loader /> : "Publish"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------------------------------------------------
   Reusable Input Component (typed props)
--------------------------------------------------------- */
function Input({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || ""}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
        placeholderTextColor={COLORS.textSecondary}
      />
    </>
  );
}

/* ---------------------------------------------------------
   STYLES (Responsive)
--------------------------------------------------------- */
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: wp(5),
    paddingBottom: hp(3),
    backgroundColor: COLORS.background,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1),
  },
  backText: {
    fontSize: wp(4),
    marginLeft: wp(2),
    color: COLORS.text,
  },
  header: {
    fontSize: wp(7),
    fontWeight: "800",
    marginBottom: hp(2),
    color: COLORS.text,
  },
  typeRow: {
    flexDirection: "row",
    gap: wp(3),
    marginBottom: hp(2),
  },
  typeBtn: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    backgroundColor: "#fff",
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtnText: { fontWeight: "700", color: COLORS.text },

  label: {
    fontSize: wp(3.8),
    fontWeight: "700",
    marginTop: hp(1.5),
    marginBottom: hp(0.5),
    color: COLORS.text,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    borderRadius: wp(3),
    padding: hp(2),
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  uploadText: { fontWeight: "700", color: COLORS.text },
  uploadSub: { color: COLORS.textSecondary, marginTop: 6 },

  input: {
    backgroundColor: "#fff",
    padding: wp(4),
    borderRadius: wp(3),
    fontSize: wp(4),
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  multilineInput: {
    minHeight: hp(15),
    textAlignVertical: "top",
  },

  previewImage: {
    width: "100%",
    height: hp(25),
    borderRadius: wp(3),
  },

  submitBtn: { marginTop: hp(3), borderRadius: wp(3), overflow: "hidden" },
  submitGradient: {
    padding: hp(2),
    borderRadius: wp(3),
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: wp(4.5),
  },
});
