// components/profile/ProfileScreen.tsx
import { COLORS } from "@/constants/themes";
import { useProfile } from "@/hooks/useProfile";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProfileImageCache } from "@/hooks/useProfileImageCache";
import { ActivityStatsCard } from "../../components/Profile/ActivityStatsCard";
import { ProfileBottomSheet } from "../../components/Profile/ProfileBottomSheet";
import { ProfileContent } from "../../components/Profile/ProfileContent";
import { ProfileHeader } from "../../components/Profile/ProfileHeader";

export default function ProfileScreen({
  route,
}: {
  route?: { params?: { profileId?: string } };
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profileId = route?.params?.profileId;
  const imageCacheBuster = useProfileImageCache();

  const {
    current,
    stats,
    isOwner,
    editing,
    setEditing,
    fullname,
    setFullname,
    year,
    setYear,
    emails,
    setEmails,
    departments,
    setDepartments,
    interests,
    setInterests,
    imageUrl,
    setImageUrl,
    resumeUrl,
    setResumeUrl,
    sheetVisible,
    sheetType,
    sheetInput,
    setSheetInput,
    suggestions,
    slideAnim,
    openSheet,
    closeSheet,
    addItem,
    handleSheetAddManual,
    openImageCropper, // ← NEW: circular crop
    saveProfile,
    signOut,
    uploadToConvex,
  } = useProfile(profileId);

  // ────── RESUME PICKER ──────
  const pickResume = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (res.canceled) return;
    const uri = (res as any).uri || res.assets?.[0]?.uri;
    if (!uri) return;
    try {
      const { finalUrl } = await uploadToConvex(uri);
      setResumeUrl(finalUrl ?? undefined);
    } catch {
      alert("Upload failed");
    }
  };

  // ────── REMOVE HELPERS ──────
  const removeEmail = (i: number) =>
    setEmails((s) => s.filter((_, idx) => idx !== i));
  const removeDepartment = (i: number) =>
    setDepartments((s) => s.filter((_, idx) => idx !== i));
  const removeInterest = (i: number) =>
    setInterests((s) => s.filter((_, idx) => idx !== i));

  if (!current) return <Text style={{ padding: 20 }}>Loading...</Text>;

  return (
    <>
      {/* Dark status bar */}
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: COLORS.background }}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: insets.top + 12, // ← pushes header down
            paddingBottom: insets.bottom + 30,
          }}
        >
          {/* ────── HEADER CARD ────── */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 18,
              paddingVertical: 24,
              paddingHorizontal: 18,
              marginHorizontal: 6,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <ProfileHeader
              imageUrl={imageUrl}
              fullname={fullname}
              year={year}
              editing={editing}
              imageCacheBuster={imageCacheBuster}
              setFullname={setFullname}
              setYear={setYear}
              openImageCropper={openImageCropper} // ← circular crop
              isOwner={isOwner}
                posts={current.posts}  
              followers={current.followers} 
              following={current.following} 
            />
          </View>

          {/* ────── CONTENT ────── */}
          <ProfileContent
            emails={emails}
            departments={departments}
            interests={interests}
            resumeUrl={resumeUrl}
            editing={editing}
            setEmails={setEmails}
            openSheet={openSheet}
            pickResume={pickResume}
            removeEmail={removeEmail}
            removeDepartment={removeDepartment}
            removeInterest={removeInterest}
          />

          {/* ────── ACTIVITY STATS ────── */}
          <ActivityStatsCard stats={stats} />

          {/* ────── ACTION BUTTONS ────── */}
          <View style={{ marginTop: 22 }}>
            {!editing ? (
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
                onPress={() => setEditing(true)}
              >
                <MaterialIcons name="edit" size={18} color="#fff" />
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                >
                  Edit Profile
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#ddd",
                    borderRadius: 12,
                    paddingVertical: 14,
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => setEditing(false)}
                >
                  <Text style={{ color: "#333", fontWeight: "700" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 12,
                    paddingVertical: 14,
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onPress={saveProfile}
                >
                  <MaterialIcons name="save" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
                </TouchableOpacity>
              </View>
            )}

            {!editing && (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: "#f0f0f0",
                }}
                onPress={async () => {
                  await signOut();
                  router.replace("/(auth)/login");
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: "red",
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  Log Out
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Extra bottom padding */}
          <View style={{ height: insets.bottom + 30 }} />
        </ScrollView>

        {/* ────── BOTTOM SHEET ────── */}
        <ProfileBottomSheet
          visible={sheetVisible}
          type={sheetType}
          input={sheetInput}
          setInput={setSheetInput}
          suggestions={suggestions}
          slideAnim={slideAnim}
          closeSheet={closeSheet}
          addItem={addItem}
          handleAddManual={handleSheetAddManual}
        />
      </KeyboardAvoidingView>
    </>
  );
}
