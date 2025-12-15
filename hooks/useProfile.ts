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
import { useToast } from "@/components/Toast/ToastProvider";

/* ===================== CONSTANTS ===================== */

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

const EMAIL_DOMAINS = [
  "@gmail.com",
  "@yahoo.com",
  "@outlook.com",
  "@marwadiuniversity.ac.in",
] as const;

/* ===================== HOOK ===================== */

export function useProfile(profileId?: string) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const toast = useToast();

  /* ---------------- QUERIES ---------------- */

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

  /* ---------------- MUTATIONS ---------------- */

  const generateUploadUrl = useMutation(api.storage.generateProfileUploadUrl);
  const getFileUrl = useMutation(api.storage.getFileUrl);
  const updateProfile = useMutation(api.users.updateUserProfile);

  const isOwner = current?.clerkId === user?.id;

  /* ---------------- STATE ---------------- */

  const [editing, setEditing] = useState(false);
  const [fullname, setFullname] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [resumeUrl, setResumeUrl] = useState<string | undefined>();

  /* ---------------- BOTTOM SHEET ---------------- */

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState<
    "department" | "interest" | "email"
  >("department");
  const [sheetInput, setSheetInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  /* ---------------- LOAD PROFILE ---------------- */

  useEffect(() => {
    if (!current) return;
    setFullname(current.fullname ?? "");
    setYear(current.year ?? "");
    setBio(current.bio ?? "");
    setEmails(current.emails ?? (current.email ? [current.email] : []));
    setDepartments(current.departments ?? []);
    setInterests(current.interests ?? []);
    setImageUrl(current.image ?? undefined);
    setResumeUrl(current.resumeUrl ?? undefined);
  }, [current]);

  /* =========================================================
     🔴 FIX #1: DEPARTMENT SUGGESTIONS MUST NOT DEPEND ON INPUT
  ========================================================= */

  useEffect(() => {
    const t = sheetInput.trim().toLowerCase();

    if (sheetType === "department") {
      setSuggestions(
        MU_DEPARTMENTS.filter((d) => !departments.includes(d))
      );
      return;
    }

    if (!t) {
      setSuggestions([]);
      return;
    }

    if (sheetType === "interest") {
      setSuggestions(
        INTEREST_SUGGESTIONS.filter(
          (i) => i.toLowerCase().includes(t) && !interests.includes(i)
        )
      );
    } else {
      setSuggestions(EMAIL_DOMAINS.map((d) => `${sheetInput}${d}`));
    }
  }, [sheetInput, sheetType, departments, interests]);

  /* =========================================================
     🔴 FIX #2: OPEN SHEET MUST PRELOAD DEPARTMENTS
  ========================================================= */

  const openSheet = (type: "department" | "interest" | "email") => {
    setSheetType(type);
    setSheetInput("");
    setSheetVisible(true);

    if (type === "department") {
     setSuggestions([...MU_DEPARTMENTS]);

    } else {
      setSuggestions([]);
    }

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

  /* =========================================================
     🔴 FIX #3: ONLY ONE DEPARTMENT ALLOWED
  ========================================================= */

  const addItem = (item: string) => {
    if (sheetType === "department") {
      setDepartments([item]); // ✅ replace
      closeSheet();
      return;
    }

    if (sheetType === "interest" && !interests.includes(item))
      setInterests((s) => [...s, item]);

    if (sheetType === "email" && !emails.includes(item))
      setEmails((s) => [...s, item]);

    setSheetInput("");
  };

  /* ---------------- SAVE PROFILE ---------------- */

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
      toast.show(
        { title: "Saved", message: "Profile updated successfully." },
        "success"
      );
    } catch (err) {
      toast.show(
        { title: "Error", message: String(err) },
        "error"
      );
    }
  };

  /* =========================================================
     🔴 FIX #4: BLOCK MANUAL ADD FOR DEPARTMENT
  ========================================================= */

  const handleSheetAddManual = () => {
    if (sheetType === "department") return;
    addItem(sheetInput.trim());
  };

  /* ---------------- RETURN ---------------- */

  return {
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

    openImageCropper: async () => {},
    imageCacheBuster: Date.now(),
    pickAndCropImage: async () => {},
    saveProfile,
    signOut,
    uploadToConvex: async (uri: any) => ({ storageId: "", finalUrl: "" }),
  };
}
