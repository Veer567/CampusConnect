import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
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
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/themes";
import { api } from "../../../convex/_generated/api";
import { Loader } from "@/components/Loader";

/* ---------------------------
   Responsive helpers
----------------------------*/
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export default function EditMarketplace() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const post = useQuery(
    api.marketplace.getMarketplacePostById,
    id ? { id: id as any } : "skip"
  );

  const updatePost = useMutation(api.marketplace.updateMarketplacePost);
  const deletePost = useMutation(api.marketplace.deleteMarketplacePost);

  /* ---------------------------
     Local form states
----------------------------*/
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [lastDateToJoin, setLastDateToJoin] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------------------
     Load post into state
----------------------------*/
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setDescription(post.description);
      setTags((post.tags ?? []).join(", "));
      setLookingFor(post.lookingFor ?? "");
      setEventDate(post.eventDate ?? "");
      setLastDateToJoin(post.lastDateToJoin ?? "");
      setLocation(post.location ?? "");
      setImage(post.imageUrl ?? null);
    }
  }, [post]);

  const postType = post?.type ?? "project";

  /* ---------------------------
     Android back override
----------------------------*/
  useEffect(() => {
    const backAction = () => {
      router.replace(`/marketplace?tab=${postType}`);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => sub.remove();
  }, [postType, router]);

  /* ---------------------------
     Image Picker + Compression
----------------------------*/
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Allow gallery access to pick an image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const compressed = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.7 }
        );
        setImage(compressed.uri);
      }
    } catch (err) {
      console.log("Image pick error:", err);
    }
  };

  /* ---------------------------
     SAVE CHANGES
----------------------------*/
  const submit = useCallback(async () => {
    if (!post) return;

    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing fields", "Please fill title & description.");
      return;
    }

    setLoading(true);

    try {
      await updatePost({
        id: id as any,
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        lookingFor: lookingFor.trim() || undefined,
        eventDate: eventDate || undefined,
        lastDateToJoin: lastDateToJoin || undefined,
        imageUrl: image || undefined,
        location: location.trim() || "Remote",
      });

      router.replace(`/marketplace?tab=${postType}`);
    } catch (err) {
      console.log("Update error:", err);
      Alert.alert("Failed", "Could not update post. Please try again.");
    }

    setLoading(false);
  }, [
    id,
    title,
    description,
    tags,
    lookingFor,
    eventDate,
    lastDateToJoin,
    image,
    location,
    postType,
  ]);

  /* ---------------------------
     DELETE POST
----------------------------*/
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

  /* ---------------------------
     Loading state
----------------------------*/
  if (!post) {
    return (
     <Loader />
      );
  }

  /* ---------------------------
     UI
----------------------------*/
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.replace(`/marketplace?tab=${postType}`)}
        style={styles.backRow}
      >
        <Ionicons name="arrow-back" size={26} color={COLORS.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Edit {postType.toUpperCase()}</Text>

      {/* Image */}
      <Text style={styles.label}>Cover Image</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
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
      <Input
        label="Last Date to Join"
        value={lastDateToJoin}
        onChange={setLastDateToJoin}
        placeholder="YYYY-MM-DD"
      />
      <Input label="Location" value={location} onChange={setLocation} />

      {/* Save Changes */}
      <TouchableOpacity
        disabled={loading}
        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
        onPress={submit}
      >
        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.submitGradient}>
          <Text style={styles.submitText}>{loading ? <Loader /> : "Save Changes"}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteBtn} onPress={deleteConfirm}>
        <Text style={styles.deleteText}>Delete Post</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------------------------
   Reusable input component
----------------------------*/
function Input({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
        placeholderTextColor={COLORS.textSecondary}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </>
  );
}

/* ---------------------------
   Styles (fully responsive)
----------------------------*/
const styles = StyleSheet.create({
  container: {
    padding: wp(5),
    paddingBottom: hp(10),
    backgroundColor: COLORS.background,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1.5),
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
  label: {
    fontSize: wp(3.7),
    fontWeight: "700",
    marginTop: hp(1),
    marginBottom: hp(0.6),
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
  uploadSub: { color: COLORS.textSecondary, marginTop: 4 },
  previewImage: {
    width: "100%",
    height: hp(25),
    borderRadius: wp(3),
  },
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
  submitBtn: {
    marginTop: hp(3),
    borderRadius: wp(3),
    overflow: "hidden",
  },
  submitGradient: {
    padding: hp(2),
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: wp(4.5),
  },
  deleteBtn: {
    marginTop: hp(3),
    padding: hp(1.8),
    backgroundColor: COLORS.surfaceLight,
    borderRadius: wp(3),
    alignItems: "center",
  },
  deleteText: {
    color: "red",
    fontWeight: "700",
    fontSize: wp(4),
  },
});
