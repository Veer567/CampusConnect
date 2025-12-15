// components/profile/ProfileScreen.tsx
import { COLORS } from "@/constants/themes";
import { useProfile } from "@/hooks/useProfile";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import ProfileContent from "@/components/Profile/ProfileContent";


import { ProfileHeader } from "../../components/Profile/ProfileHeader";
import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------
    FULL PAGE SKELETON LOADER (SHIMMER)
------------------------------------------------------------------ */
const Shimmer = ({ style }: any) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 350],
  });

  return (
    <View
      style={[
        {
          backgroundColor: "#e7e7e7",
          overflow: "hidden",
          position: "relative",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: 100,
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.45)",
          position: "absolute",
          top: 0,
          left: 0,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

const ProfileScreenSkeleton = () => {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: 18, paddingTop: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER CARD */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          paddingVertical: 24,
          paddingHorizontal: 18,
          marginHorizontal: 6,
        }}
      >
        {/* Avatar */}
        <Shimmer
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            alignSelf: "center",
            marginBottom: 16,
          }}
        />

        {/* Name */}
        <Shimmer
          style={{
            height: 20,
            width: "50%",
            alignSelf: "center",
            borderRadius: 6,
            marginBottom: 10,
          }}
        />

        {/* Year */}
        <Shimmer
          style={{
            height: 16,
            width: "30%",
            alignSelf: "center",
            borderRadius: 6,
            marginBottom: 18,
          }}
        />

        {/* Stats Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <Shimmer style={{ width: "30%", height: 60, borderRadius: 10 }} />
          <Shimmer style={{ width: "30%", height: 60, borderRadius: 10 }} />
          <Shimmer style={{ width: "30%", height: 60, borderRadius: 10 }} />
        </View>
      </View>

      {/* CONTENT SECTIONS */}
      <View style={{ marginTop: 30 }}>
        {/* Title */}
        <Shimmer
          style={{
            height: 20,
            width: "40%",
            marginBottom: 20,
            borderRadius: 8,
          }}
        />

        {/* Three rows */}
        {[1, 2, 3].map((i) => (
          <Shimmer
            key={i}
            style={{
              height: 45,
              borderRadius: 10,
              marginBottom: 16,
            }}
          />
        ))}
      </View>

      {/* ACTIVITY STATS */}
      <View style={{ marginTop: 30 }}>
        <Shimmer
          style={{
            height: 120,
            width: "100%",
            borderRadius: 14,
          }}
        />
      </View>

      {/* EDIT BUTTON */}
      <View style={{ marginTop: 30 }}>
        <Shimmer
          style={{
            height: 50,
            width: "100%",
            borderRadius: 12,
          }}
        />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

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
    openImageCropper,
    saveProfile,
    signOut,
    uploadToConvex,
  } = useProfile(profileId);

  /* --- PICK RESUME --- */
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

  const removeEmail = (i: number) =>
    setEmails((s) => s.filter((_, idx) => idx !== i));
  const removeDepartment = (i: number) =>
    setDepartments((s) => s.filter((_, idx) => idx !== i));
  const removeInterest = (i: number) =>
    setInterests((s) => s.filter((_, idx) => idx !== i));

  /* ------------------------------------
      SHOW SKELETON WHILE LOADING
  ------------------------------------ */
  if (!current) return <ProfileScreenSkeleton />;

  return (
    <>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: COLORS.background }}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 30,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER CARD */}
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
              openImageCropper={openImageCropper}
              isOwner={isOwner}
              username={current.username}
        
              posts={current.posts}
              followers={current.followers}
              following={current.following}
              userId={current._id}
            />
          </View>

          {/* CONTENT */}
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

          {/* ACTIVITY STATS */}
          <ActivityStatsCard {...({ stats } as any)} />

          {/* ACTION BUTTONS */}
          <View style={{ marginTop: 22 }}>
            {!editing ? (
              <Pressable
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
              </Pressable>
            ) : (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
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
                </Pressable>

                <Pressable
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
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Save
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>

        {/* BOTTOM SHEET */}
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
