import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/themes";
import { api } from "../../../convex/_generated/api";
import { Loader } from "@/components/Loader";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import { Animated, Easing } from "react-native";

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
     Animated Date Picker
----------------------------*/
  const [showPicker, setShowPicker] = useState(false);
  const [pickerField, setPickerField] = useState<"event" | "join" | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const slideAnim = useRef(new Animated.Value(0)).current;

  const openPicker = (field: "event" | "join", currentValue?: string) => {
    setPickerField(field);

    if (currentValue) {
      const d = dayjs(currentValue, "DD/MM/YYYY");
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
     Android back override
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
     Image Picker
----------------------------*/
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow gallery access.");
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
  };

  /* ---------------------------
     Submit
----------------------------*/
  const submit = useCallback(async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing fields", "Please fill title & description.");
      return;
    }

    setLoading(true);

    try {
      await updatePost({
        id: id as any,
        title,
        description,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        lookingFor,
        eventDate: eventDate || undefined,
        lastDateToJoin: lastDateToJoin || undefined,
        imageUrl: image || undefined,
        location: location.trim() || "Remote",
      });

      router.replace(`/marketplace?tab=${postType}`);
    } catch {
      Alert.alert("Failed", "Could not update post.");
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
          await deletePost({ id: id as any });
          router.replace(`/marketplace?tab=${postType}`);
        },
      },
    ]);
  };

  /* ---------------------------
     UI
----------------------------*/
  if (!post) return <Loader />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      {/* Event Date (only hackathon) */}
      {postType === "hackathon" && (
        <DateInput
          label="Event Date"
          value={eventDate}
          onPress={() => openPicker("event", eventDate)}
          onChange={setEventDate}
        />
      )}

      {/* Last Date to Join (all types) */}
      <DateInput
        label="Last Date to Join"
        value={lastDateToJoin}
        onPress={() => openPicker("join", lastDateToJoin)}
        onChange={setLastDateToJoin}
      />

      <Input label="Location" value={location} onChange={setLocation} />

      {/* Save */}
      <TouchableOpacity
        disabled={loading}
        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
        onPress={submit}
      >
        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.submitGradient}>
          <Text style={styles.submitText}>{loading ? "Saving..." : "Save Changes"}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={deleteConfirm}>
        <Text style={styles.deleteText}>Delete Post</Text>
      </TouchableOpacity>

      {/* ----------------------- DATE PICKER MODAL ------------------------- */}
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
              Select Date
            </Text>

            <DateTimePicker
              mode="single"
              date={pickerDate}
              onChange={(params) => {
                if (!params.date) return;
                const d =
                  params.date instanceof Date
                    ? params.date
                    : dayjs(params.date).toDate();

                const formatted = dayjs(d).format("DD/MM/YYYY");

                if (pickerField === "event") setEventDate(formatted);
                if (pickerField === "join") setLastDateToJoin(formatted);

                closePicker();
              }}
            />

            <TouchableOpacity onPress={closePicker} style={{ padding: 12, alignItems: "center" }}>
              <Text style={{ color: COLORS.primary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ---------------------------
   Date Input with Icon
----------------------------*/
function DateInput({ label, value, onPress }: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onPress} style={styles.dateInputWrapper}>
        <TextInput
          value={value}
          placeholder="DD/MM/YYYY"
          style={styles.dateInput}
          editable={false}
        />
        <Ionicons
          name="calendar-outline"
          size={22}
          color={COLORS.textSecondary}
          style={styles.calendarIcon}
        />
      </TouchableOpacity>
    </>
  );
}

/* ---------------------------
   Text Input Component
----------------------------*/
function Input({ label, value, onChange, multiline = false }: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor={COLORS.textSecondary}
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
    paddingBottom: hp(10),
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
  label: {
    fontSize: wp(3.7),
    fontWeight: "700",
    marginTop: hp(1),
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
  uploadSub: { color: COLORS.textSecondary, marginTop: 4 },

  previewImage: {
    width: "100%",
    height: hp(25),
    borderRadius: wp(3),
  },

  /* Text Inputs */
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

  /* Date Input */
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: wp(3),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.5),
  },
  dateInput: {
    flex: 1,
    fontSize: wp(4),
    color: COLORS.text,
  },
  calendarIcon: {
    marginLeft: wp(2),
  },

  /* Buttons */
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
