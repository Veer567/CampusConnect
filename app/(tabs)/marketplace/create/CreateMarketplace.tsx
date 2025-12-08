import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
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
  KeyboardAvoidingView,
  Modal,
  Platform,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import dayjs from "dayjs";
import DateTimePicker from "react-native-ui-datepicker";

import { COLORS } from "../../../../constants/themes";
import { api } from "../../../../convex/_generated/api";

/* ---------------------------
   Responsive helpers
----------------------------*/
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

type ValidType = "project" | "hackathon" | "startup";

/* ---------------------------------------------------------
   Utilities
--------------------------------------------------------- */
const tryParseDate = (input?: string) => {
  if (!input) return null;
  // try multiple formats
  const formats = ["DD/MM/YYYY", "D/M/YYYY", "DD-MM-YYYY", "YYYY-MM-DD"];
  for (const fmt of formats) {
    const d = dayjs(input, fmt, true);
    if (d.isValid()) return d.toDate();
  }
  // fallback: try Dayjs loose parse
  const d = dayjs(input);
  return d.isValid() ? d.toDate() : null;
};

export default function CreateMarketplace() {
  const router = useRouter();
  const { type } = useLocalSearchParams();

  // valid post types
  const validTypes = ["project", "hackathon", "startup"] as const;
  const initialType = validTypes.includes(type as any)
    ? (type as any)
    : "project";

  const [postType, setPostType] = useState<ValidType>(initialType);

  const createPost = useMutation(api.marketplace.createMarketplacePost);

  // form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [lastDateToJoin, setLastDateToJoin] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  /* ---------------------------------------------------------
     PICK IMAGE
  --------------------------------------------------------- */
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission required",
          "Please allow photo access to upload an image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,

        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;

        try {
          const compressed = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1080 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );
          setImage(compressed.uri);
        } catch {
          setImage(uri);
        }
      }
    } catch (err) {
      console.error("Image pick error", err);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  /* ---------------------------------------------------------
     ANDROID BACK BUTTON HANDLING
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
     DATE PICKER (shared modal) - Option 1 style (sliding)
     - lastDateToJoin is available for all types
     - eventDate only for hackathon
  --------------------------------------------------------- */
  const [calendarField, setCalendarField] = useState<"event" | "join" | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const openPicker = (field: "event" | "join", currentVal?: string) => {
    setCalendarField(field);

    const parsed = tryParseDate(
      currentVal || (field === "event" ? eventDate : lastDateToJoin)
    );
    setSelectedDate(parsed ?? new Date());

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
    }).start(() => {
      setShowPicker(false);
      setCalendarField(null);
    });
  };

  /* ---------------------------------------------------------
     SUBMIT
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

  /* ---------------------------------------------------------
     FIELD CONFIG → dynamic fields by post type
     We moved lastDateToJoin into all, and eventDate only in hackathon
  --------------------------------------------------------- */
  const fieldConfig: Record<ValidType, string[]> = {
    project: [
      "title",
      "description",
      "tags",
      "lookingFor",
      "lastDateToJoin",
      "location",
    ],
    hackathon: [
      "title",
      "description",
      "eventDate",
      "lastDateToJoin",
      "location",
    ],
    startup: [
      "title",
      "description",
      "lookingFor",
      "tags",
      "lastDateToJoin",
      "location",
    ],
  };

  const fieldMeta: Record<
    string,
    { label: string; placeholder: string; multiline?: boolean }
  > = {
    title: { label: "Title", placeholder: "Enter post title" },
    description: {
      label: "Description",
      placeholder: "Describe your project / event / startup...",
      multiline: true,
    },
    tags: { label: "Skills / Tags", placeholder: "e.g., React, AI, ML" },
    lookingFor: {
      label: "Looking For",
      placeholder: "Developers, designers, teammates...",
    },
    eventDate: {
      label: "Event Date",
      placeholder: "dd/MM/YYYY",
    },
    lastDateToJoin: {
      label: "Last Date to Join",
      placeholder: "dd/MM/YYYY",
    },
    location: {
      label: "Location",
      placeholder: "Remote / On-campus / City name",
    },
  };

  /* ---------------------------------------------------------
     VALUE + SETTER MAPPER
  --------------------------------------------------------- */
  const getValue = (field: string) => {
    switch (field) {
      case "title":
        return title;
      case "description":
        return description;
      case "tags":
        return tags;
      case "lookingFor":
        return lookingFor;
      case "eventDate":
        return eventDate;
      case "lastDateToJoin":
        return lastDateToJoin;
      case "location":
        return location;
      default:
        return "";
    }
  };

  const setValue = (field: string, v: string) => {
    switch (field) {
      case "title":
        setTitle(v);
        break;
      case "description":
        setDescription(v);
        break;
      case "tags":
        setTags(v);
        break;
      case "lookingFor":
        setLookingFor(v);
        break;
      case "eventDate":
        setEventDate(formatDateInput(v));
        break;
      case "lastDateToJoin":
        setLastDateToJoin(formatDateInput(v));
        break;
      case "location":
        setLocation(v);
        break;
    }
  };

  /* ---------------------------------------------------------
     DATE INPUT FORMATTING helper → dd/MM/YYYY while typing
  --------------------------------------------------------- */
  const formatDateInput = (input: string) => {
    const digits = input.replace(/\D/g, "");

    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 0) || digits.slice(4, 8)}`;
  };

  /* ---------------------------------------------------------
     Refs for date inputs so we can blur on focus (prevent keyboard)
  --------------------------------------------------------- */
  const eventInputRef = useRef<TextInput | null>(null);
  const joinInputRef = useRef<TextInput | null>(null);

  /* ---------------------------------------------------------
     Render
  --------------------------------------------------------- */
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
          {(["project", "hackathon", "startup"] as ValidType[]).map((t) => {
            const active = postType === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setPostType(t)}
                style={[
                  styles.typeBtn,
                  active && { backgroundColor: COLORS.primary },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.typeBtnText, active && { color: "#fff" }]}>
                  {t[0].toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Image Picker */}
        <Text style={styles.label}>Cover Image</Text>
        <TouchableOpacity onPress={pickImage} style={styles.uploadBox}>
          {!image ? (
            <>
              <Text style={styles.uploadText}>Upload Cover Image</Text>
              <Text style={styles.uploadSub}>Tap to select</Text>
            </>
          ) : (
            <RNImage source={{ uri: image }} style={styles.previewImage} />
          )}
        </TouchableOpacity>

        {/* Dynamic Fields */}
        {fieldConfig[postType].map((field) => {
          const meta = fieldMeta[field];
          // For date fields we will show the same TextInput UI but open the picker on focus
          if (field === "eventDate") {
            return (
              <View key={field}>
                <Text style={styles.label}>{meta.label}</Text>
                <View style={styles.dateInputWrapper}>
                  <TextInput
                    ref={eventInputRef}
                    value={eventDate}
                    placeholder={meta.placeholder}
                    placeholderTextColor={COLORS.textSecondary}
                    onChangeText={(v) => setValue(field, v)}
                    onFocus={() => {
                      eventInputRef.current?.blur();
                      openPicker("event", eventDate);
                    }}
                    style={styles.dateTextInput}
                  />

                  <TouchableOpacity
                    onPress={() => openPicker("event", eventDate)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color={COLORS.textSecondary}
                      style={styles.calendarIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          if (field === "lastDateToJoin") {
            return (
              <View key={field}>
                <Text style={styles.label}>{meta.label}</Text>
                <View style={styles.dateInputWrapper}>
                  <TextInput
                    ref={joinInputRef}
                    value={lastDateToJoin}
                    placeholder={meta.placeholder}
                    placeholderTextColor={COLORS.textSecondary}
                    onChangeText={(v) => setValue(field, v)}
                    onFocus={() => {
                      joinInputRef.current?.blur();
                      openPicker("join", lastDateToJoin);
                    }}
                    style={styles.dateTextInput}
                  />

                  <TouchableOpacity
                    onPress={() => openPicker("join", lastDateToJoin)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color={COLORS.textSecondary}
                      style={styles.calendarIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          // Normal input
          const multiline = Boolean(meta.multiline);
          return (
            <View key={field}>
              <Text style={styles.label}>{meta.label}</Text>
              <TextInput
                value={getValue(field)}
                onChangeText={(v) => setValue(field, v)}
                placeholder={meta.placeholder}
                placeholderTextColor={COLORS.textSecondary}
                multiline={multiline}
                style={[styles.input, multiline && styles.multilineInput]}
              />
            </View>
          );
        })}

        {/* Submit */}
        <TouchableOpacity
          disabled={loading}
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={submit}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.submitGradient}
          >
            <Text style={styles.submitText}>Publish</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* DATE PICKER MODAL (sliding beautiful UI) */}
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
                Select Date
              </Text>

              <DateTimePicker
                mode="single"
                date={selectedDate}
                onChange={(params) => {
                  if (!params.date) return;

                  const d =
                    params.date instanceof Date
                      ? params.date
                      : dayjs(params.date).toDate();

                  setSelectedDate(d);
                  const formatted = dayjs(d).format("DD/MM/YYYY");

                  if (calendarField === "event") setEventDate(formatted);
                  else if (calendarField === "join")
                    setLastDateToJoin(formatted);

                  closePicker();
                }}
              />

              <TouchableOpacity
                onPress={closePicker}
                style={{ marginTop: 10, padding: 12, alignItems: "center" }}
              >
                <Text style={{ color: COLORS.primary, fontSize: 16 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------------------------------------------------
   Styles
--------------------------------------------------------- */
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: wp(5),
    paddingBottom: hp(8),
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
    marginBottom: hp(1),
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
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: wp(3),
    paddingHorizontal: wp(3),
    marginBottom: hp(1),
  },
  dateTextInput: {
    flex: 1,
    paddingVertical: hp(1.5),
    fontSize: wp(4),
    color: COLORS.text,
  },
  calendarIcon: {
    marginLeft: wp(1),
  },
});
