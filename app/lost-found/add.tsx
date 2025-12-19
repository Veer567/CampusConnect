// app/lost-found/add.tsx
import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast/ToastProvider";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [loading, setLoading] = useState(false);

  const createLostItem = useMutation(api.lostItems.addLostItem);
  const navigation = useNavigation();
  const toast = useToast();

  useEffect(() => {
    // hide tab bar
    navigation.setOptions({
      tabBarStyle: { display: "none" },
    });

    return () => {
      // restore tab bar when leaving
      navigation.setOptions({
        tabBarStyle: undefined,
      });
    };
  }, []);

  // shimmer animation
  const shimmer = useRef(new Animated.Value(0)).current;

  const startShimmer = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopShimmer = () => {
    shimmer.stopAnimation();
    shimmer.setValue(0);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  const handleSubmit = async () => {
    if(!image) {
      toast.show(
        {
          title: "Image Required",
          message: "Please upload an image of the item.",
        },
        "error"
      );
    }
    if (!title.trim())
      return toast.show(
        { title: "Missing Title", message: "Please enter the item title." },
        "error"
      );

    if (!desc.trim())
      return toast.show(
        { title: "Missing Description", message: "Please describe the item." },
        "error"
      );

    if (!location.trim())
      return toast.show(
        {
          title: "Missing Location",
          message: "Please enter where the item was lost or found.",
        },
        "error"
      );

    if (!image)
      return toast.show(
        {
          title: "Image Required",
          message: "Please upload an image of the item.",
        },
        "error"
      );

    try {
      setLoading(true);

      await createLostItem({
        title,
        description: desc,
        location,
        status,
        category: undefined,
        imageUrl: image ?? "",
      });

      toast.show(
        {
          title: "Success 🎉",
          message: "Your lost/found item has been posted.",
        },
        "success"
      );

      router.back();
    } catch (err) {
      toast.show(
        {
          title: "Upload Failed",
          message: "Could not upload the item. Try again.",
        },
        "error"
      );
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
     <View style={{ flex: 1, backgroundColor: COLORS.background  , marginTop: -50}}>
       <SafeAreaView style={{ flex: 1 }}>
         {/* Header / Back */}
   
         <KeyboardAvoidingView
           behavior={Platform.OS === "ios" ? "padding" : "height"}
           style={{ flex: 1 }}
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
          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={wp(12)} color="#888" />
                <Text style={styles.imageText}>Upload Image</Text>
              </>
            )}
          </Pressable>

          {/* FORM */}
          <View style={styles.formCard}>
            <Text style={styles.label}>Item Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Black Laptop Bag"
              placeholderTextColor="#6B7280" // visible grey
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, { height: hp(12) }]}
              multiline
              placeholder="Describe the item..."
              placeholderTextColor="#6B7280"
              value={desc}
              onChangeText={setDesc}
            />

            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Library 2nd Floor"
              placeholderTextColor="#6B7280"
              value={location}
              onChangeText={setLocation}
            />

            {/* STATUS */}
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {["lost", "found"].map((s) => (
                <Pressable
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
                </Pressable>
              ))}
            </View>
          </View>

          {/* SUBMIT BUTTON WITH SHIMMER */}
          <Pressable
            disabled={loading}
            onPress={handleSubmit}
            onPressIn={startShimmer}
            onPressOut={stopShimmer}
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            <Animated.View
              style={{
                opacity: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.4],
                }),
              }}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>Submit</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  
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

  submitBtn: {
    borderRadius: wp(3),
    marginTop: hp(1),
    overflow: "hidden",
  },
  submitGradient: {
    paddingVertical: hp(2.2),
    borderRadius: wp(3),
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: wp(5),
    fontWeight: "700",
  },
});
