import React, { useEffect, useState } from "react";
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

  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const updateProfile = useMutation(api.users.updateUserProfile);
  const updateProfilePicture = useMutation(api.users.updateProfilePicture);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

  const [fullname, setFullname] = useState("");
  const [year, setYear] = useState("");
  const [departments, setDepartments] = useState("");
  const [interests, setInterests] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>();

  useEffect(() => {
    if (!dbUser) return;
    setFullname(dbUser.fullname ?? "");
    setYear(dbUser.year ?? "");
    setDepartments((dbUser.departments ?? []).join(", "));
    setInterests((dbUser.interests ?? []).join(", "));
    setImageUri(dbUser.image ?? user?.imageUrl ?? undefined);
  }, [dbUser]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  const uploadImageToConvex = async (uri: string) => {
    const uploadUrl = await generateUploadUrl();
    const blob = await (await fetch(uri)).blob();

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });

    const { storageId } = await res.json();
    return storageId;
  };

  const handleSave = async () => {
    if (!dbUser?._id) return;

    try {
      if (imageUri && imageUri !== dbUser.image) {
        const storageId = await uploadImageToConvex(imageUri);
        await updateProfilePicture({ storageId });
      }

      await updateProfile({
        id: dbUser._id,
        fullname,
        year,
        departments: departments.split(",").map((s) => s.trim()),
        interests: interests.split(",").map((s) => s.trim()),
      });

      toast.show({ type: "success", message: "Profile updated" });
      router.back();
    } catch {
      toast.show({ type: "error", message: "Update failed" });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} />
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
        <Pressable onPress={handleSave}>
          <Text style={styles.save}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Pressable onPress={pickImage} style={styles.avatarWrap}>
          <Image
            source={{ uri: imageUri || "https://i.pravatar.cc/300" }}
            style={styles.avatar}
          />
          <Ionicons name="camera" size={22} color="#fff" style={styles.cam} />
        </Pressable>

        <Input label="Full Name" value={fullname} onChange={setFullname} />
        <Input label="Year" value={year} onChange={setYear} />
        <Input
          label="Departments"
          value={departments}
          onChange={setDepartments}
        />
        <Input
          label="Interests"
          value={interests}
          onChange={setInterests}
        />
      </ScrollView>
    </View>
  );
}

const Input = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      style={styles.input}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  title: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "700" },
  save: { color: COLORS.blue, fontWeight: "700" },
  avatarWrap: { alignSelf: "center", marginBottom: 24 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  cam: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 20,
  },
  label: { marginBottom: 6, color: "#555" },
  input: {
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
