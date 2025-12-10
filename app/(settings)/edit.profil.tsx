// /app/(settings)/edit-profile.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { COLORS } from "@/constants/themes";
import { useToast } from "@/components/Toast/ToastProvider";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const toast = useToast();

  // Fetch Convex user profile
  const dbUser = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id ?? "",
  });

  const updateProfile = useMutation(api.users.updateUserProfile);
  const uploadUrl = useMutation(api.users.updateProfilePicture);

  const [fullname, setFullname] = useState(user?.fullName || "");
  const [bio, setBio] = useState(dbUser?.bio || "");
  const [year, setYear] = useState(dbUser?.year || "");
  const [departments, setDepartments] = useState(
    (dbUser?.departments || []).join(", ")
  );
  const [interests, setInterests] = useState(
    (dbUser?.interests || []).join(", ")
  );

  const [imageUri, setImageUri] = useState(dbUser?.image ?? user?.imageUrl);

  /* ------------------ Pick Profile Image ------------------ */
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (res.canceled) return;

    const asset = res.assets[0];
    setImageUri(asset.uri);
  };

  /* ---------------------- Save Profile --------------------- */
  const handleSave = async () => {
    if (!dbUser?._id) {
      toast.show({ type: "error", message: "User not loaded." });
      return;
    }

    try {
      // Upload photo
      if (imageUri && imageUri !== dbUser.image) {
        const file = await fetch(imageUri);
        const blob = await file.blob();

        const storageId = await updateProfilePictureToConvex(blob);
        await uploadUrl({ storageId });
      }

      await updateProfile({
        id: dbUser._id,
        fullname,
        bio,
        year,
        departments: departments.split(",").map((s) => s.trim()),
        interests: interests.split(",").map((s) => s.trim()),
      });

      toast.show({ type: "success", message: "Profile updated!" });
      router.back();
    } catch (err) {
      console.log(err);
      toast.show({ type: "error", message: "Update failed. Try again." });
    }
  };

  /* Upload image to Convex storage */
  const updateProfilePictureToConvex = async (blob: Blob) => {
    const uploadURL = await api.users.getUserProfile();
    const res = await fetch(uploadURL, {
      method: "POST",
      body: blob,
    });
    const { storageId } = await res.json();
    return storageId;
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>

        <Pressable onPress={handleSave}>
          <Text style={styles.saveBtn}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Profile Photo */}
        <Pressable style={styles.avatarContainer} onPress={pickImage}>
          <Image
            source={{ uri: imageUri || "https://i.pravatar.cc/300" }}
            style={styles.avatar}
          />
          <Ionicons
            name="camera-outline"
            size={24}
            color="#fff"
            style={styles.cameraIcon}
          />
        </Pressable>

        {/* FORM */}
        <View style={styles.form}>
          <Input label="Full Name" value={fullname} onChange={setFullname} />
          <Input label="Bio" value={bio} onChange={setBio} multiline />
          <Input label="Year" value={year} onChange={setYear} />
          <Input
            label="Departments (comma separated)"
            value={departments}
            onChange={setDepartments}
          />
          <Input
            label="Interests (comma separated)"
            value={interests}
            onChange={setInterests}
          />
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------ INPUT COMPONENT ------------------------ */
const Input = ({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && { height: 90 }]}
      value={value}
      onChangeText={onChange}
      multiline={multiline}
    />
  </View>
);

/* ----------------------------- STYLES ----------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  backBtn: { marginRight: 12 },

  headerTitle: { flex: 1, fontSize: 22, fontWeight: "700", color: "#111" },

  saveBtn: {
    color: COLORS.blue,
    fontWeight: "700",
    fontSize: 16,
  },

  avatarContainer: {
    alignSelf: "center",
    marginBottom: 24,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 110,
  },

  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 20,
  },

  form: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },

  label: { color: "#555", marginBottom: 6 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f7f7f7",
    fontSize: 15,
  },
});
