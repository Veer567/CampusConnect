import CustomStatusBar from "@/components/CustomStatusBar";
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
} from "react-native";

/* Responsive helpers */
const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

export default function AddLostItem() {
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"lost" | "found">("lost");

  const createLostItem = useMutation(api.lostItems.addLostItem);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!title || !desc || !location) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }

    try {
      await createLostItem({
        title,
        description: desc,
        location,
        status,
        category: undefined,
        imageUrl: image ?? "",
      });

      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to upload item.");
      console.log(err);
    }
  };

  return (
    <>
      <CustomStatusBar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? hp(8) : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: hp(5) }}
        >
          <Text style={styles.header}>Report Item</Text>
          <Text style={styles.subheader}>
            Help others by reporting lost or found items
          </Text>

          {/* IMAGE PICKER */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={wp(12)} color="#888" />
                <Text style={styles.imageText}>Upload Image</Text>
              </>
            )}
          </TouchableOpacity>

          {/* FORM */}
          <View style={styles.formCard}>
            <Text style={styles.label}>Item Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Black Laptop Bag"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, { height: hp(12) }]}
              multiline
              placeholder="Describe the item..."
              value={desc}
              onChangeText={setDesc}
            />

            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Library 2nd Floor"
              value={location}
              onChangeText={setLocation}
            />

            {/* STATUS */}
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {["lost", "found"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusChip,
                    status === s && styles.statusChipActive,
                  ]}
                  onPress={() => setStatus(s as "lost" | "found")}
                >
                  <Text
                    style={[
                      styles.statusText,
                      status === s && styles.statusTextActive,
                    ]}
                  >
                    {s === "lost" ? "Lost" : "Found"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* SUBMIT */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit Item</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

/*───────────────────────────────────────────────
 🔹 RESPONSIVE STYLES
───────────────────────────────────────────────*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    padding: wp(5),
  },

  header: {
    fontSize: wp(7),
    fontWeight: "700",
    color: "#222",
    marginBottom: hp(0.5),
  },
  subheader: {
    color: "#666",
    fontSize: wp(3.5),
    marginBottom: hp(2),
  },

  /* IMAGE PICKER */
  imagePicker: {
    backgroundColor: "#fff",
    height: hp(25),
    borderRadius: wp(3),
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    marginBottom: hp(2.5),
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: wp(3),
  },
  imageText: {
    color: "#666",
    marginTop: hp(1),
    fontWeight: "500",
    fontSize: wp(3.6),
  },

  /* FORM */
  formCard: {
    backgroundColor: "#fff",
    padding: wp(4),
    borderRadius: wp(3),
    elevation: 3,
    marginBottom: hp(2.5),
  },

  label: {
    fontWeight: "600",
    fontSize: wp(4),
    color: "#333",
    marginTop: hp(1.5),
  },

  input: {
    backgroundColor: "#F1F3F6",
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(3.5),
    borderRadius: wp(2),
    marginTop: hp(0.8),
    fontSize: wp(3.8),
    color: "#333",
  },

  /* STATUS ROW */
  statusRow: {
    flexDirection: "row",
    marginTop: hp(1.3),
  },
  statusChip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: wp(5),
    backgroundColor: "#EAECEF",
    marginRight: wp(2.5),
  },
  statusChipActive: {
    backgroundColor: COLORS.primary,
  },
  statusText: {
    color: "#555",
    fontSize: wp(3.8),
  },
  statusTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  /* SUBMIT BUTTON */
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: hp(2.2),
    borderRadius: wp(3),
    alignItems: "center",
    marginTop: hp(1),
  },
  submitText: {
    color: "#fff",
    fontSize: wp(5),
    fontWeight: "700",
  },
});
