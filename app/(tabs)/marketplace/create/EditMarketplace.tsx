import { Loader } from "@/components/Loader";
import { useToast } from "@/components/Toast/ToastProvider";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import dayjs from "dayjs";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "react-native-ui-datepicker";
import { COLORS } from "../../../../constants/themes";
import { api } from "../../../../convex/_generated/api";

/* ---------------------------
   Responsive helpers
----------------------------*/
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export default function EditMarketplace() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { show } = useToast();

  const post = useQuery(
    api.marketplace.getMarketplacePostById,
    id ? { id: id as any } : "skip"
  );

  const updatePost = useMutation(api.marketplace.updateMarketplacePost);
  const deletePost = useMutation(api.marketplace.deleteMarketplacePost);

  /* ---------------------------
     Local state
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
     Load post data
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
     Date picker animation
----------------------------*/
  const [showPicker, setShowPicker] = useState(false);
  const [pickerField, setPickerField] = useState<"event" | "join" | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const slideAnim = useRef(new Animated.Value(0)).current;

  const openPicker = (field: "event" | "join", value?: string) => {
    setPickerField(field);
    if (value) {
      const d = dayjs(value, "DD/MM/YYYY");
      if (d.isValid()) setPickerDate(d.toDate());
    }
    setShowPicker(true);
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const closePicker = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setShowPicker(false));
  };

  /* ---------------------------
     Android back
----------------------------*/
  useEffect(() => {
    const backAction = () => {
      router.replace(`/marketplace?tab=${postType}`);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => sub.remove();
  }, [postType]);

  /* ---------------------------
     Image picker
----------------------------*/
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

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
  };

  /* ---------------------------
     Submit
----------------------------*/
  const submit = useCallback(async () => {
    if (!title.trim() || !description.trim()) {
      show(
        {
          title: "Missing Information",
          message: "Title and description are required",
        },
        "info"
      );
      return;
    }

    setLoading(true);
    try {
      await updatePost({
        id: id as any,
        title,
        description,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        lookingFor,
        eventDate: eventDate || undefined,
        lastDateToJoin: lastDateToJoin || undefined,
        imageUrl: image || undefined,
        location: location.trim() || "Remote",
      });

      show(
        { title: "Updated", message: "Post updated successfully" },
        "success"
      );

      router.replace(`/marketplace?tab=${postType}`);
    } catch {
      show({ title: "Update Failed", message: "Please try again" }, "error");
    }
    setLoading(false);
  }, [title, description, tags, lookingFor, eventDate, lastDateToJoin, image]);

  /* ---------------------------
     Delete
----------------------------*/
  const deleteConfirm = () => {
    Alert.alert("Delete Post?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePost({ id: id as any });

            show(
              { title: "Deleted", message: "Post deleted successfully" },
              "success"
            );

            router.replace(`/marketplace?tab=${postType}`);
          } catch {
            show(
              { title: "Delete Failed", message: "Try again later" },
              "error"
            );
          }
        },
      },
    ]);
  };

  if (!post) return <Loader />;

  /* ---------------------------
     UI
----------------------------*/
  return (
    <View
      style={{ flex: 1, backgroundColor: COLORS.background, marginTop: -50 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header / Back */}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity
              onPress={() => router.replace(`/marketplace?tab=${postType}`)}
              style={styles.backRow}
            >
              <Ionicons name="arrow-back" size={26} color={COLORS.text} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.header}>Edit {postType.toUpperCase()}</Text>

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

            <Input label="Title" value={title} onChange={setTitle} />
            <Input
              label="Description"
              value={description}
              onChange={setDescription}
              multiline
            />
            <Input label="Skills / Tags" value={tags}  onChange={setTags} />
            <Input
              label="Looking For"
              value={lookingFor}
              onChange={setLookingFor}
            />

            {postType === "hackathon" && (
              <DateInput
                label="Event Date"
                value={eventDate}
                onPress={() => openPicker("event", eventDate)}
              />
            )}

            <DateInput
              label="Last Date to Join"
              value={lastDateToJoin}
              onPress={() => openPicker("join", lastDateToJoin)}
            />

            <Input label="Location" value={location} onChange={setLocation} />

            <TouchableOpacity
              disabled={loading}
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={submit}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {loading ? "Saving..." : "Save Changes"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={deleteConfirm}>
              <Text style={styles.deleteText}>Delete Post</Text>
            </TouchableOpacity>

            {/* DATE PICKER */}
            <Modal visible={showPicker} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <Animated.View
                  style={[
                    styles.modalBox,
                    {
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [200, 0],
                          }),
                        },
                      ],
                      opacity: slideAnim,
                    },
                  ]}
                >
                  <Text style={styles.modalTitle}>Select Date</Text>

                  <DateTimePicker
                    mode="single"
                    date={pickerDate}
                    onChange={(p) => {
                      if (!p.date) return;
                      const d = dayjs(p.date).format("DD/MM/YYYY");
                      if (pickerField === "event") setEventDate(d);
                      if (pickerField === "join") setLastDateToJoin(d);
                      closePicker();
                    }}
                  />

                  <TouchableOpacity
                    onPress={closePicker}
                    style={styles.modalCancel}
                  >
                    <Text style={{ color: COLORS.primary }}>Cancel</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Modal>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/* ---------------------------
   Small components
----------------------------*/
function DateInput({ label, value, onPress }: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onPress} style={styles.dateInputWrapper}>
        <TextInput
          value={value}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={COLORS.grey}
          editable={false}
          style={styles.dateInput}
        />
        <Ionicons
          name="calendar-outline"
          size={22}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    </>
  );
}

function Input({ label, value, onChange, multiline = false }: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </>
  );
}

/* ---------------------------
   Styles
----------------------------*/
const styles = StyleSheet.create({
  container: {
    padding: wp(5),
    paddingBottom: hp(2),
    backgroundColor: COLORS.background,
  },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: hp(1) },
  backText: { fontSize: wp(4), marginLeft: wp(2), color: COLORS.text },
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
    color: COLORS.text,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    borderRadius: wp(3),
    padding: hp(2),
    alignItems: "center",
  },
  uploadText: { fontWeight: "700", color: COLORS.grey },
  uploadSub: { color: COLORS.textSecondary, marginTop: 4 },
  previewImage: { width: "100%", height: hp(25), borderRadius: wp(3) },
  input: {
    backgroundColor: "#fff",
    padding: wp(4),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multilineInput: { minHeight: hp(15), textAlignVertical: "top" },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: wp(3),
    padding: wp(3),
  },
  dateInput: { flex: 1 },
  submitBtn: { marginTop: hp(3), borderRadius: wp(3), overflow: "hidden" },
  submitGradient: { padding: hp(2), alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "800", fontSize: wp(4.5) },
  deleteBtn: {
    marginTop: hp(3),
    padding: hp(1.8),
    backgroundColor: COLORS.surfaceLight,
    borderRadius: wp(3),
    alignItems: "center",
  },
  deleteText: { color: "red", fontWeight: "700", fontSize: wp(4) },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  modalCancel: { padding: 12, alignItems: "center" },
});
