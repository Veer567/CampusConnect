// Profile.tsx
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";

import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import * as ImageManipulator from "expo-image-manipulator";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";

/* ---------------------------
   Config lists (from your old file)
   --------------------------- */
const MU_DEPARTMENTS = [
  "Computer Engineering",
  "Information & Communication Technology (ICT)",
  "Information Technology",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
  "Environmental Science & Engineering",
  "Chemistry",
  "Physics",
  "Mathematics",
  "Microbiology",
  "Agriculture",
  "Business Administration",
  "Computer Applications",
  "Commerce",
  "Legal Studies",
  "Pharmacy",
  "Physiotherapy",
  "Humanities",
  "Nursing",
];

const INTEREST_SUGGESTIONS = [
  "Web Development",
  "AI/ML",
  "Data Science",
  "Mobile Development",
  "Game Development",
  "Cybersecurity",
  "DevOps",
  "Cloud Computing",
  "Competitive Programming",
  "UI/UX",
];

const EMAIL_DOMAINS = [
  "@gmail.com",
  "@yahoo.com",
  "@outlook.com",
  "@marwadiuniversity.ac.in",
];

/* ---------------------------
   Main component
   --------------------------- */
export default function Profile({ route }: any) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const { user } = useUser();
  const { signOut } = useAuth();
  // right after the other constants (or inside the component)
  const AVATAR_SIZE = Math.min(width, height) * 0.28; // same as you already use
  const profileId = route?.params?.profileId;

  /* ------------------------
     Convex queries / mutations
     ------------------------ */
  const current = useQuery(
    profileId ? api.users.getUserProfile : api.users.getUserByClerkId,
    profileId ? { id: profileId } : { clerkId: user?.id ?? "" }
  );

  const stats = useQuery(
    api.users.getActivityStats,
    current?._id ? { userId: current._id } : "skip"
  );

  const generateUploadUrl = useMutation(api.storage.generateProfileUploadUrl);
  const getFileUrl = useMutation(api.storage.getFileUrl);
  const updateProfile = useMutation(api.users.updateUserProfile);

  const isOwner = current?.clerkId === user?.id;

  /* ------------------------
     Local state for all fields
     ------------------------ */
  const [editing, setEditing] = useState(false);
  const [fullname, setFullname] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [resumeUrl, setResumeUrl] = useState<string | undefined>();
  const dpActionSheet = useRef<ActionSheetRef>(null);

  // bottom sheet
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState<
    "department" | "interest" | "email"
  >("department");
  const [sheetInput, setSheetInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // anim for sheet
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (current) {
      setFullname(current.fullname ?? "");
      setYear(current.year ?? "");
      setBio(current.bio ?? "");
      setEmails(current.emails ?? (current.email ? [current.email] : []));
      setDepartments(current.departments ?? []);
      setInterests(current.interests ?? []);
      setImageUrl(current.image ?? undefined);
      setResumeUrl(current.resumeUrl ?? undefined);
    }
  }, [current]);

  /* ------------------------
     Bottom sheet helpers
     ------------------------ */
  function openSheet(type: "department" | "interest" | "email") {
    setSheetType(type);
    setSheetInput("");
    setSuggestions([]);
    setSheetVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }

  function closeSheet() {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSheetVisible(false));
  }

  useEffect(() => {
    // update suggestions when input changes
    const t = sheetInput.trim().toLowerCase();
    if (!t) {
      setSuggestions([]);
      return;
    }
    if (sheetType === "department") {
      const filtered = MU_DEPARTMENTS.filter(
        (d) => d.toLowerCase().includes(t) && !departments.includes(d)
      );
      setSuggestions(filtered);
    } else if (sheetType === "interest") {
      const filtered = INTEREST_SUGGESTIONS.filter(
        (i) => i.toLowerCase().includes(t) && !interests.includes(i)
      );
      setSuggestions(filtered);
    } else {
      const domainMatches = EMAIL_DOMAINS.map((d) => `${sheetInput}${d}`);
      setSuggestions(domainMatches);
    }
  }, [sheetInput, sheetType, departments, interests]);

  /* ------------------------
     Convex storage upload helper
     ------------------------ */
  async function uploadToConvex(uri: string) {
    // generate upload url from server
    const uploadUrl = await generateUploadUrl();

    // fetch file and upload
    const fileRes = await fetch(uri);
    const blob = await fileRes.blob();

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });

    const { storageId } = await res.json();
    const finalUrl = await getFileUrl({ storageId });
    return { storageId, finalUrl };
  }

  /* ------------------------
     Pickers
     ------------------------ */

  async function cropToCircle(uri: string) {
    const info = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const width = info.width;
    const height = info.height;
    const cropSize = Math.min(width, height);

    return ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: (width - cropSize) / 2,
            originY: (height - cropSize) / 2,
            width: cropSize,
            height: cropSize,
          },
        },
      ],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
  }

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Allow photo access.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (res.canceled) return;

    const { uri } = res.assets[0];
    const { finalUrl } = await uploadToConvex(uri);
    setImageUrl(finalUrl ?? undefined);
  };

  const pickResume = async () => {
    if (!isOwner) return;
    const res = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (res.canceled) return;

    const file = res.assets?.[0];
    if (!file?.uri) return;

    // expo-document-picker returns uri in res.uri (older) or res.assets
    const uri = (res as any).uri || (res as any).assets?.[0]?.uri;
    if (!uri) return;
    try {
      const { finalUrl } = await uploadToConvex(uri);
      setResumeUrl(finalUrl ?? undefined);
    } catch (err) {
      Alert.alert("Upload failed", "Could not upload resume.");
      console.error(err);
    }
  };

  /* ------------------------
     Sheet actions
     ------------------------ */
  function addFromSheet(item: string) {
    if (sheetType === "department") {
      if (departments.includes(item)) return;
      setDepartments((s) => [...s, item]);
    } else if (sheetType === "interest") {
      if (interests.includes(item)) return;
      setInterests((s) => [...s, item]);
    } else {
      if (emails.includes(item)) return;
      setEmails((s) => [...s, item]);
    }
    setSheetInput("");
    setSuggestions([]);
  }

  function handleSheetAddManual() {
    const v = sheetInput.trim();
    if (!v) return;
    addFromSheet(v);
    setSheetInput("");
  }

  /* ------------------------
     Save profile (Convex update)
     ------------------------ */
  const saveProfile = async () => {
    if (!current) return;
    try {
      await updateProfile({
        id: current._id,
        fullname,
        bio,
        year,
        emails,
        departments,
        interests,
        imageUrl,
        resumeUrl,
      });
      setEditing(false);
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (err) {
      Alert.alert("Error", String(err));
      console.error(err);
    }
  };

  /* ------------------------
     Small UI helpers
     ------------------------ */
  const removeDepartment = (idx: number) =>
    setDepartments((s) => s.filter((_, i) => i !== idx));
  const removeInterest = (idx: number) =>
    setInterests((s) => s.filter((_, i) => i !== idx));
  const removeEmail = (idx: number) =>
    setEmails((s) => s.filter((_, i) => i !== idx));

  if (!current) return <Text style={{ padding: 20 }}>Loading...</Text>;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0],
  });

  /* ------------------------
     Sign out
     ------------------------ */
  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (err) {
      Alert.alert("Sign out failed", "Please try again.");
      console.error("Sign out error:", err);
    }
  };

  const pickAndCrop = async () => {
    try {
      // Request permission
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission required", "Please allow access to photos.");
        return;
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square crop
        quality: 1,
      });

      if (result.canceled) return;

      const { uri } = result.assets[0];

      // Crop to perfect circle using ImageManipulator
      const manipResult = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      // Upload
      const { finalUrl } = await uploadToConvex(manipResult.uri);
      setImageUrl(finalUrl ?? undefined);
    } catch (err) {
      console.log("Image pick/crop error:", err);
      Alert.alert("Error", "Failed to process image.");
    }
  };
  /* ------------------------
     UI
     ------------------------ */
  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: COLORS.background }}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingBottom: insets.bottom + 30,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Card header (large rounded card like your screenshot) */}
          <View style={[styles.headerCard]}>
            <View style={{ alignItems: "center" }}>
              <TouchableOpacity
                onPress={pickImage}
                activeOpacity={isOwner ? 0.8 : 1}
              >
                <View style={styles.avatarWrap}>
                  <Image
                    source={{ uri: imageUrl || "https://i.pravatar.cc/300" }}
                    style={[
                      styles.avatar,
                      {
                        width: Math.min(width, height) * 0.28,
                        height: Math.min(width, height) * 0.28,
                        borderRadius: (Math.min(width, height) * 0.28) / 2,
                      },
                    ]}
                    resizeMode="cover"
                  />
                  {isOwner && (
                    <View style={styles.smallEditIcon}>
                      <Ionicons name="create-outline" size={16} color="#fff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Name */}
              {editing ? (
                <TextInput
                  value={fullname}
                  onChangeText={setFullname}
                  style={[
                    styles.nameEditable,
                    { fontSize: Math.min(width, height) * 0.055 },
                  ]}
                />
              ) : (
                <Text
                  style={[
                    styles.name,
                    { fontSize: Math.min(width, height) * 0.055 },
                  ]}
                >
                  {fullname || "—"}
                </Text>
              )}

              {/* Year badge */}
              {editing ? (
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  style={[
                    styles.yearEditable,
                    { fontSize: Math.min(width, height) * 0.034 },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.badge,
                    { paddingHorizontal: Math.min(width, height) * 0.03 },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { fontSize: Math.min(width, height) * 0.034 },
                    ]}
                  >
                    {year || "Year —"}
                  </Text>
                </View>
              )}

              {/* Stats */}
              <View style={[styles.statsRow, { marginTop: 18 }]}>
                <View style={styles.stat}>
                  <Text
                    style={[
                      styles.statValue,
                      { fontSize: Math.min(width, height) * 0.045 },
                    ]}
                  >
                    {stats?.posts ?? 0}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { fontSize: Math.min(width, height) * 0.032 },
                    ]}
                  >
                    Posts
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text
                    style={[
                      styles.statValue,
                      { fontSize: Math.min(width, height) * 0.045 },
                    ]}
                  >
                    {stats?.likes ?? 0}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { fontSize: Math.min(width, height) * 0.032 },
                    ]}
                  >
                    Likes
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text
                    style={[
                      styles.statValue,
                      { fontSize: Math.min(width, height) * 0.045 },
                    ]}
                  >
                    {stats?.bookmarks ?? 0}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { fontSize: Math.min(width, height) * 0.032 },
                    ]}
                  >
                    Bookmarks
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
              {editing ? (
                <TextInput
                  value={emails[0] ?? ""}
                  onChangeText={(t) => setEmails([t, ...emails.slice(1)])}
                  style={styles.infoInput}
                />
              ) : (
                <Text style={styles.infoText}>{emails[0] ?? "—"}</Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Ionicons
                name="school-outline"
                size={18}
                color={COLORS.primary}
              />
              {editing ? (
                <TouchableOpacity onPress={() => openSheet("department")}>
                  <Text style={[styles.infoText, { color: COLORS.primary }]}>
                    {departments[0] ?? "Pick Department"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.infoText}>{departments[0] ?? "—"}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => resumeUrl && Linking.openURL(resumeUrl)}
            >
              <Ionicons name="link-outline" size={18} color={COLORS.blue} />
              <Text style={[styles.infoText, { color: COLORS.blue }]}>
                {resumeUrl
                  ? "View Resume"
                  : editing
                    ? "Upload Resume"
                    : "No Resume"}
              </Text>
            </TouchableOpacity>

            {editing && (
              <View style={{ marginTop: 10, flexDirection: "row", gap: 12 }}>
                <TouchableOpacity onPress={pickResume} style={styles.smallBtn}>
                  <Text style={{ color: COLORS.primary }}>
                    Upload/Replace Resume
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openSheet("email")}
                  style={styles.smallBtn}
                >
                  <Text style={{ color: COLORS.primary }}>Add Email</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Interests + chips */}
          <View style={{ marginTop: 18 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.sectionTitle}>Interests</Text>
              {editing && (
                <TouchableOpacity onPress={() => openSheet("interest")}>
                  <Text style={{ color: COLORS.primary }}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.tagsRow}>
              {interests.length === 0 && !editing ? (
                <Text style={{ color: "#666" }}>No interests added</Text>
              ) : (
                interests.map((t, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                    {editing && (
                      <TouchableOpacity
                        onPress={() => removeInterest(i)}
                        style={{ marginLeft: 8 }}
                      >
                        <Text style={{ color: "red" }}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Departments chips */}
          <View style={{ marginTop: 18 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.sectionTitle}>Departments</Text>
              {editing && (
                <TouchableOpacity onPress={() => openSheet("department")}>
                  <Text style={{ color: COLORS.primary }}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.tagsRow}>
              {departments.length === 0 && !editing ? (
                <Text style={{ color: "#666" }}>No department added</Text>
              ) : (
                departments.map((t, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                    {editing && (
                      <TouchableOpacity
                        onPress={() => removeDepartment(i)}
                        style={{ marginLeft: 8 }}
                      >
                        <Text style={{ color: "red" }}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Activity Stats card row (small) */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Activity Stats</Text>
            <View style={styles.activityContainer}>
              {[
                { label: "Posts", value: stats?.posts ?? 0 },
                { label: "Likes", value: stats?.likes ?? 0 },
                { label: "Bookmarks", value: stats?.bookmarks ?? 0 },
              ].map((it, idx) => (
                <View key={idx} style={styles.activityCard}>
                  <Text style={styles.activityValue}>{String(it.value)}</Text>
                  <Text style={styles.activityLabel}>{it.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Edit / Save controls */}
          <View style={{ marginTop: 22 }}>
            {!editing ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setEditing(true)}
              >
                <MaterialIcons name="edit" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: "#ddd", flex: 1 },
                  ]}
                  onPress={() => setEditing(false)}
                >
                  <Text style={[styles.primaryBtnText, { color: "#333" }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1 }]}
                  onPress={saveProfile}
                >
                  <MaterialIcons name="save" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Logout available when NOT editing */}
            {!editing && (
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleSignOut}
              >
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: insets.bottom + 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom sheet modal */}
      <Modal transparent visible={sheetVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.sheetOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: "100%" }}
              keyboardVerticalOffset={100}
            >
              <Animated.View
                style={[styles.sheetContainer, { transform: [{ translateY }] }]}
              >
                <View style={styles.sheetHeader}>
                  <Text style={{ fontSize: 16, fontWeight: "700" }}>
                    {sheetType === "department"
                      ? "Add Department"
                      : sheetType === "interest"
                        ? "Add Interest"
                        : "Add Email"}
                  </Text>
                  <TouchableOpacity onPress={closeSheet}>
                    <Text style={{ color: "#888" }}>Close</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder={
                    sheetType === "department"
                      ? "Search departments..."
                      : sheetType === "interest"
                        ? "Search interests..."
                        : "Enter email local part"
                  }
                  value={sheetInput}
                  onChangeText={setSheetInput}
                  style={[styles.input, { marginTop: 10 }]}
                  autoFocus
                />

                <ScrollView style={{ maxHeight: 220, marginTop: 8 }}>
                  {suggestions.length === 0 && sheetInput.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={handleSheetAddManual}
                      style={{ padding: 10 }}
                    >
                      <Text style={{ color: COLORS.primary }}>
                        Add "{sheetInput}"
                      </Text>
                    </TouchableOpacity>
                  )}

                  {suggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => addFromSheet(s)}
                      style={styles.suggestionRow}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  <TouchableOpacity
                    onPress={closeSheet}
                    style={[styles.modalBtn, { backgroundColor: "#eee" }]}
                  >
                    <Text>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSheetAddManual}
                    style={[
                      styles.modalBtn,
                      { backgroundColor: COLORS.primary },
                    ]}
                  >
                    <Text style={{ color: "#fff" }}>Add</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <ActionSheet ref={dpActionSheet} gestureEnabled>
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 14 }}>
            Profile Photo
          </Text>

          {/* Choose Image */}
          <TouchableOpacity
            style={{ paddingVertical: 12, flexDirection: "row", gap: 10 }}
            onPress={pickImage}
          >
            <Ionicons name="image-outline" size={22} color={COLORS.primary} />
            <Text style={{ fontSize: 16 }}>Choose from Gallery</Text>
          </TouchableOpacity>

          {/* Crop Image */}
          <TouchableOpacity
            style={{ paddingVertical: 12, flexDirection: "row", gap: 10 }}
            onPress={pickAndCrop}
          >
            <Ionicons name="crop-outline" size={22} color={COLORS.primary} />
            <Text style={{ fontSize: 16 }}>Crop Image</Text>
          </TouchableOpacity>

          {/* Remove Image */}
          <TouchableOpacity
            style={{ paddingVertical: 12, flexDirection: "row", gap: 10 }}
            onPress={() => {
              setImageUrl(undefined);
              dpActionSheet.current?.hide();
            }}
          >
            <Ionicons name="trash-outline" size={22} color="red" />
            <Text style={{ fontSize: 16, color: "red" }}>Remove Photo</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>
    </>
  );
}

/* ------------------------
   Styles (tailored to match screenshot)
   ------------------------ */
const styles = StyleSheet.create({
  headerCard: {
    marginTop: 12,
    marginHorizontal: 6,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  smallEditIcon: {
    position: "absolute",
    bottom: 6,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 6,
    elevation: 3,
  },
  avatar: {
    borderWidth: 4,
    borderColor: COLORS.primary,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  name: {
    marginTop: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  nameEditable: {
    marginTop: 10,
    fontWeight: "700",
    color: COLORS.primary,
    backgroundColor: "#f8fbff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badge: {
    backgroundColor: COLORS.secondary,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 8,
    alignSelf: "center",
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
  },
  yearEditable: {
    marginTop: 8,
    backgroundColor: "#f8fbff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  statLabel: {
    color: COLORS.grey,
  },

  infoBox: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    color: "#333",
    fontSize: 15,
    flexShrink: 1,
  },
  infoInput: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 4,
    flex: 1,
  },

  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tag: {
    backgroundColor: "#f3f7ff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: COLORS.secondary,
    fontWeight: "600",
  },

  activityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    width: "32%",
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  activityValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  activityLabel: {
    color: COLORS.grey,
    fontSize: 13,
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    elevation: 3,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  logoutBtn: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  logoutText: {
    textAlign: "center",
    color: "red",
    fontWeight: "700",
    fontSize: 16,
  },

  /* bottom sheet */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: 220,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  suggestionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  suggestionText: { color: "#333" },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#f1f1f1",
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },

  smallBtn: {
    borderRadius: 10,
    padding: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
});
