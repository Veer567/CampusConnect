import { COLORS } from "@/constants/themes";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/create.styles";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false); // ✅ new state for confirmation step

  // Image picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setIsConfirmed(false); // show confirmation screen next
    }
  };

  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost);

  const handleShare = async () => {
    if (!selectedImage) return;

    try {
      setIsSharing(true);
      const uploadUrl = await generateUploadUrl();

      const uploadResult = await FileSystem.uploadAsync(
        uploadUrl,
        selectedImage,
        {
          httpMethod: "POST",
          mimeType: "image/jpeg",
        }
      );

      if (uploadResult.status !== 200) throw new Error("Upload failed");

      const { storageId } = JSON.parse(uploadResult.body);
      await createPost({ storageId, caption });

      router.push("/(tabs)");
    } catch (error) {
      console.log("Error Sharing Post")
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
          {/* STEP 1: No Image Selected */}
          {!selectedImage ? (
            <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={28} color={COLORS.blue} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Post</Text>
                <View style={{ width: 28 }} />
              </View>

              <TouchableOpacity
                style={styles.emptyImageContainer}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={48} color={COLORS.grey} />
                <Text style={styles.emptyImageText}>
                  Tap to select an Image
                </Text>
              </TouchableOpacity>
            </View>
          ) : !isConfirmed ? (
            /* STEP 2: Confirm Image Screen */
            <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setSelectedImage(null)}>
                  <Ionicons
                    name="arrow-back"
                    size={28}
                    color={COLORS.blue}
                  />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirm Image</Text>
                <View style={{ width: 28 }} />
              </View>

              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={{ uri: selectedImage }}
                  style={{
                    width: "80%",
                    height: 300,
                    borderRadius: 16,
                    marginBottom: 40,
                  }}
                  contentFit="cover"
                  transition={200}
                />

                {/* Confirm / Cancel buttons */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    width: "80%",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.blue,
                      borderRadius: 10,
                      paddingVertical: 12,
                      paddingHorizontal: 32,
                    }}
                    onPress={() => setIsConfirmed(true)} // ✅ move to next step
                  >
                    <Text
                      style={{
                        color: COLORS.white,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Choose
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.grey,
                      borderRadius: 10,
                      paddingVertical: 12,
                      paddingHorizontal: 32,
                    }}
                    onPress={() => setSelectedImage(null)} // cancel
                  >
                    <Text
                      style={{
                        color: COLORS.white,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            /* STEP 3: Final Post Creation */
            <View style={styles.contentContainer}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedImage(null);
                    setCaption("");
                    setIsConfirmed(false);
                  }}
                  disabled={isSharing}
                >
                  <Ionicons
                    name="close-outline"
                    size={28}
                    color={isSharing ? COLORS.grey : COLORS.white}
                  />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>New Post</Text>

                <TouchableOpacity
                  style={[
                    styles.shareButton,
                    isSharing && styles.shareButtonDisabled,
                  ]}
                  disabled={isSharing || !selectedImage}
                  onPress={handleShare}
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color={COLORS.blue} />
                  ) : (
                    <Text style={styles.shareText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                keyboardShouldPersistTaps="handled"
                contentOffset={{ x: 0, y: 100 }}
              >
                <View
                  style={[styles.content, isSharing && styles.contentDisabled]}
                >
                  <View style={styles.imageSection}>
                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.previewImage}
                      contentFit="cover"
                      transition={200}
                    />

                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={pickImage}
                      disabled={isSharing}
                    >
                      <Ionicons
                        name="image-outline"
                        size={20}
                        color={COLORS.white}
                      />
                      <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Caption Input */}
                  <View style={styles.inputSection}>
                    <View style={styles.captionContainer}>
                      <Image
                        source={user?.imageUrl}
                        style={styles.userAvatar}
                        contentFit="cover"
                        transition={200}
                      />
                      <TextInput
                        style={styles.captionInput}
                        placeholder="Write a caption..."
                        placeholderTextColor={COLORS.grey}
                        value={caption}
                        onChangeText={setCaption}
                        editable={!isSharing}
                        multiline
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
