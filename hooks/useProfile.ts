// hooks/useProfile.ts
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated } from "react-native";
import { triggerProfileImageUpdate } from "./useProfileImageCache";


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
] as const;

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
] as const;

const EMAIL_DOMAINS = ["@gmail.com", "@yahoo.com", "@outlook.com", "@marwadiuniversity.ac.in"] as const;

export function useProfile(profileId?: string) {
  const { user } = useUser();
  const { signOut } = useAuth();

  // ────── QUERIES ──────
  const current = useQuery(
    profileId ? api.users.getUserProfile : api.users.getUserByClerkId,
    profileId
      ? { id: profileId as Id<"users"> }
      : user?.id
        ? { clerkId: user.id }
        : "skip"
  );

  const stats = useQuery(
    api.users.getActivityStats,
    current?._id ? { userId: current._id } : "skip"
  );

  // ────── MUTATIONS ──────
  const generateUploadUrl = useMutation(api.storage.generateProfileUploadUrl);
  const getFileUrl = useMutation(api.storage.getFileUrl);
  const updateProfile = useMutation(api.users.updateUserProfile);

  const isOwner = current?.clerkId === user?.id;

  // ────── STATE ──────
  const [editing, setEditing] = useState(false);
  const [fullname, setFullname] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [resumeUrl, setResumeUrl] = useState<string | undefined>();

  // Bottom sheet
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState<"department" | "interest" | "email">("department");
  const [sheetInput, setSheetInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ────── LOAD DATA ──────
  useEffect(() => {
    if (current) {
      setFullname(current.fullname ?? "");
      setYear(current.year ?? "");
      setBio(current.bio ?? "");
      setEmails(current.emails ?? (current.email ? [current.email] : []));
      setDepartments(current.departments ?? []);
      setInterests(current.interests ?? []);
     setImageUrl(current.image ?? undefined); // ← force sync
      setResumeUrl(current.resumeUrl ?? undefined);
    }
  }, [current]);

  // ────── SUGGESTIONS ──────
  useEffect(() => {
    const t = sheetInput.trim().toLowerCase();
    if (!t) return setSuggestions([]);

    if (sheetType === "department") {
      setSuggestions(
        MU_DEPARTMENTS.filter(
          (d) => d.toLowerCase().includes(t) && !departments.includes(d)
        )
      );
    } else if (sheetType === "interest") {
      setSuggestions(
        INTEREST_SUGGESTIONS.filter(
          (i) => i.toLowerCase().includes(t) && !interests.includes(i)
        )
      );
    } else {
      setSuggestions(EMAIL_DOMAINS.map((d) => `${sheetInput}${d}`));
    }
  }, [sheetInput, sheetType, departments, interests]);

  // ────── UPLOAD HELPER ──────
  const uploadToConvex = async (uri: string): Promise<{ storageId: string; finalUrl: string }> => {
    const uploadUrl = await generateUploadUrl();
    const fileRes = await fetch(uri);
    const blob = await fileRes.blob();
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });
    const { storageId } = await res.json();
    const urlResult = await getFileUrl({ storageId });
    if (!urlResult) throw new Error("Failed to get file URL");
    return { storageId, finalUrl: urlResult };
  };

  // ────── IMAGE CROP & UPLOAD (CIRCULAR) ──────
  const [imageCacheBuster, setImageCacheBuster] = useState(Date.now());

  const openImageCropper = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to change avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) return;

    const { uri } = result.assets[0];

    // Force perfect circle
    const manip = await ImageManipulator.manipulateAsync(uri, [], { compress: 0.9 });
    const size = Math.min(manip.width, manip.height);
    const cropX = (manip.width - size) / 2;
    const cropY = (manip.height - size) / 2;

    const cropped = await ImageManipulator.manipulateAsync(
      manip.uri,
      [{ crop: { originX: cropX, originY: cropY, width: size, height: size } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );

    const { finalUrl } = await uploadToConvex(cropped.uri);
    setImageUrl(finalUrl);
   triggerProfileImageUpdate();   // ← GLOBAL
  };

  // ────── LEGACY (keep for now) ──────
  const pickAndCropImage = openImageCropper; // fallback

  // ────── SAVE PROFILE ──────
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
    }
  };

  // ────── BOTTOM SHEET CONTROLS ──────
  const openSheet = (type: "department" | "interest" | "email") => {
    setSheetType(type);
    setSheetInput("");
    setSuggestions([]);
    setSheetVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSheetVisible(false));
  };

  const addItem = (item: string) => {
    if (sheetType === "department" && !departments.includes(item))
      setDepartments((s) => [...s, item]);
    if (sheetType === "interest" && !interests.includes(item))
      setInterests((s) => [...s, item]);
    if (sheetType === "email" && !emails.includes(item))
      setEmails((s) => [...s, item]);
    setSheetInput("");
  };

  // ────── RETURN ──────
  return {
    // Data
    current,
    stats,
    isOwner,
    editing,
    setEditing,
    fullname,
    setFullname,
    year,
    setYear,
    bio,
    setBio,
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

    // Sheet
    sheetVisible,
    sheetType,
    sheetInput,
    setSheetInput,
    suggestions,
    slideAnim,
    openSheet,
    closeSheet,
    addItem,
    handleSheetAddManual: () => addItem(sheetInput.trim()),

    // Actions
    openImageCropper, 
    imageCacheBuster,   
    pickAndCropImage,    
    saveProfile,
    signOut,
    uploadToConvex,
  };
}