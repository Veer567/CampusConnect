// // hooks/useProfile.ts
// import { useToast } from "@/components/Toast/ToastProvider";
// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { useMutation, useQuery } from "convex/react";
// import * as ImageManipulator from "expo-image-manipulator";
// import * as ImagePicker from "expo-image-picker";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { Animated } from "react-native";

// import { DEPARTMENTS } from "@/data/departments";
// import { INTERESTS } from "@/data/interests";

// /* ======================================================
//    useProfile — FINAL (SCREEN-COMPATIBLE)
// ====================================================== */

// export function useProfile(profileId?: string) {
//   const { user } = useUser();
//   const { signOut } = useAuth();
//   const toast = useToast();

//   /* ---------------- PRIMARY EMAIL ---------------- */
//   const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? null;

//   /* ---------------- USER QUERY ---------------- */
//   const current = useQuery(
//     profileId ? api.users.getUserProfile : api.users.getUserByClerkId,
//     profileId
//       ? { id: profileId as Id<"users"> }
//       : user?.id
//         ? { clerkId: user.id }
//         : "skip"
//   );

//   /* ---------------- ACTIVITY STATS ---------------- */
//   const activityStats = useQuery(
//     api.users.getActivityStats,
//     current ? { userId: current._id } : "skip"
//   );

//   /* ---------------- MUTATIONS ---------------- */
//   const updateProfile = useMutation(api.users.updateUserProfile);
//   const generateUploadUrl = useMutation(api.storage.generateProfileUploadUrl);
//   const getFileUrl = useMutation(api.storage.getFileUrl);

//   /* ---------------- DERIVED ---------------- */
//   const isOwner = current?.clerkId === user?.id;

//   /* ---------------- STATE ---------------- */
//   const [editing, setEditing] = useState(false);
//   const [fullname, setFullname] = useState("");
//   const [year, setYear] = useState("");
//   const [bio, setBio] = useState("");

//   const [departments, setDepartments] = useState<string[]>([]);
//   const [interests, setInterests] = useState<string[]>([]);
//   const [emails, setEmails] = useState<string[]>([]);

//   const [imageUrl, setImageUrl] = useState<string | undefined>();
//   const [resumeUrl, setResumeUrl] = useState<string | undefined>();

//   /* ---------------- ACTIVITY STATS ---------------- */
//   const stats = useMemo(() => {
//     if (!activityStats) return null;
//     return {
//       likes: activityStats.likes ?? 0,
//       bookmarks: activityStats.bookmarks ?? 0,
//     };
//   }, [activityStats]);

//   /* ---------------- BOTTOM SHEET ---------------- */
//   const [sheetVisible, setSheetVisible] = useState(false);
//   const [sheetType, setSheetType] = useState<
//     "department" | "interest" | "email"
//   >("interest");

//   // 🔥 IMPORTANT: keep BOTH names
//   const [sheetInput, setSheetInput] = useState(""); // for ProfileScreen
//   const input = sheetInput; // internal alias

//   const slideAnim = useRef(new Animated.Value(300)).current;

//   /* ---------------- BASE SUGGESTIONS ---------------- */
//   const baseSuggestions = useMemo(() => {
//     if (sheetType === "department") return DEPARTMENTS;
//     if (sheetType === "interest") return INTERESTS;
//     return [];
//   }, [sheetType]);

//   /* ---------------- SEARCH ---------------- */
//   const suggestions = useMemo(() => {
//     if (!input.trim()) return baseSuggestions;
//     return baseSuggestions.filter((item) =>
//       item.toLowerCase().includes(input.toLowerCase())
//     );
//   }, [baseSuggestions, input]);

//   const openSheet = (type: "department" | "interest" | "email") => {
//     setSheetType(type);
//     setSheetInput("");
//     setSheetVisible(true);

//     Animated.timing(slideAnim, {
//       toValue: 0,
//       duration: 250,
//       useNativeDriver: true,
//     }).start();
//   };

//   const closeSheet = () => {
//     Animated.timing(slideAnim, {
//       toValue: 600,
//       duration: 200,
//       useNativeDriver: true,
//     }).start(() => setSheetVisible(false));
//   };

//   /* ---------------- ADD ITEM ---------------- */
//   const addItem = (value: string) => {
//     const v = value.trim();
//     if (!v) return;

//     if (sheetType === "department") {
//       setDepartments([v]); // single department
//     } else if (sheetType === "interest") {
//       setInterests((p) => [...new Set([...p, v])]);
//     } else {
//       setEmails((p) => [...new Set([...p, v])]);
//     }

//     closeSheet();
//   };

//   // 🔥 backward-compatible name
//   const handleSheetAddManual = () => addItem(sheetInput);

//   /* ---------------- LOAD PROFILE ---------------- */
//   useEffect(() => {
//     if (!current) return;

//     setFullname(current.fullname ?? "");
//     setYear(current.year ?? "");
//     setBio(current.bio ?? "");
//     setDepartments(current.departments ?? []);
//     setInterests(current.interests ?? []);
//     setEmails(current.emails ?? []);
//     setImageUrl(current.image ?? undefined);
//     setResumeUrl(current.resumeUrl ?? undefined);
//   }, [current]);

//   /* ---------------- IMAGE UPLOAD ---------------- */
//   const openImageCropper = async () => {
//     const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!perm.granted) return;

//     const result = await ImagePicker.launchImageLibraryAsync({
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 0.9,
//     });

//     if (result.canceled) return;

//     const resized = await ImageManipulator.manipulateAsync(
//       result.assets[0].uri,
//       [{ resize: { width: 512 } }],
//       { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
//     );

//     const uploadUrl = await generateUploadUrl();
//     const blob = await (await fetch(resized.uri)).blob();

//     const res = await fetch(uploadUrl, { method: "POST", body: blob });
//     const { storageId } = await res.json();
//     const finalUrl = await getFileUrl({ storageId });

//     setImageUrl(finalUrl ?? undefined);

//     await updateProfile({
//       image: finalUrl ?? undefined,
//     });
//   };

//   /* ---------------- GENERIC UPLOADER ---------------- */
//   const uploadToConvex = async (uri: string) => {
//     const uploadUrl = await generateUploadUrl();
//     const blob = await (await fetch(uri)).blob();

//     const res = await fetch(uploadUrl, { method: "POST", body: blob });
//     const { storageId } = await res.json();
//     const finalUrl = await getFileUrl({ storageId });

//     return { finalUrl };
//   };

//   /* ---------------- SAVE ---------------- */
//   const saveProfile = async () => {
//     if (!current) return;

//     await updateProfile({
//       fullname,
//       bio,
//       image: imageUrl,
//       departments,
//       interests,
//       emails,
//       resumeUrl,
//       year,
//     });

//     setEditing(false);
//     toast.show(
//       { title: "Saved", message: "Profile updated successfully." },
//       "success"
//     );
//   };

//   /* ================= RETURN (FULL CONTRACT) ================= */
//   return {
//     current,
//     stats,
//     isOwner,

//     editing,
//     setEditing,

//     fullname,
//     setFullname,
//     year,
//     setYear,

//     primaryEmail,

//     emails,
//     setEmails,

//     departments,
//     setDepartments,
//     interests,
//     setInterests,

//     imageUrl,
//     setImageUrl, // ✅ FIXED
//     resumeUrl,
//     setResumeUrl,

//     openImageCropper,

//     sheetVisible,
//     sheetType,
//     sheetInput, // ✅ FIXED
//     setSheetInput, // ✅ FIXED
//     suggestions,
//     slideAnim,
//     openSheet,
//     closeSheet,
//     addItem,
//     handleSheetAddManual, // ✅ FIXED

//     saveProfile,
//     uploadToConvex,
//     signOut,
//   };
// }
// hooks/useProfile.ts
import { useToast } from "@/components/Toast/ToastProvider";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated } from "react-native";

import { DEPARTMENTS } from "../data/departments";
import { INTERESTS } from "../data/intrests";

/* ======================================================
   useProfile — FINAL, BUG-FREE, CONTRACT-SAFE
====================================================== */

export function useProfile(profileId?: string) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const toast = useToast();

  /* ---------------- PRIMARY EMAIL (READ-ONLY) ---------------- */
  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  /* ---------------- USER QUERY ---------------- */
  const current = useQuery(
    profileId ? api.users.getUserProfile : api.users.getUserByClerkId,
    profileId
      ? { id: profileId as Id<"users"> }
      : user?.id
      ? { clerkId: user.id }
      : "skip"
  );

  /* ---------------- ACTIVITY STATS ---------------- */
  const activityStats = useQuery(
    api.users.getActivityStats,
    current ? { userId: current._id } : "skip"
  );

  /* ---------------- MUTATIONS ---------------- */
  const updateProfile = useMutation(api.users.updateUserProfile);
  const generateUploadUrl = useMutation(api.storage.generateProfileUploadUrl);
  const getFileUrl = useMutation(api.storage.getFileUrl);

  /* ---------------- DERIVED ---------------- */
  const isOwner = current?.clerkId === user?.id;

  /* ---------------- STATE ---------------- */
  const [editing, setEditing] = useState(false);

  const [fullname, setFullname] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");

  // 🔒 SECONDARY EMAILS ONLY (never primary)
  const [emails, setEmails] = useState<string[]>([]);

  const [departments, setDepartments] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [resumeUrl, setResumeUrl] = useState<string | undefined>();

  /* ---------------- ACTIVITY STATS MAP ---------------- */
  const stats = useMemo(() => {
    if (!activityStats) return null;
    return {
      likes: activityStats.likes ?? 0,
      bookmarks: activityStats.bookmarks ?? 0,
    };
  }, [activityStats]);

  /* ---------------- BOTTOM SHEET ---------------- */
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState<
    "department" | "interest" | "email"
  >("interest");

  const [sheetInput, setSheetInput] = useState("");
  const slideAnim = useRef(new Animated.Value(300)).current;

  /* ---------------- BASE LIST ---------------- */
  const baseSuggestions = useMemo(() => {
    if (sheetType === "department") return DEPARTMENTS;
    if (sheetType === "interest") return INTERESTS;
    return [];
  }, [sheetType]);

  /* ---------------- SEARCH FILTER ---------------- */
  const suggestions = useMemo(() => {
    if (!sheetInput.trim()) return baseSuggestions;

    return baseSuggestions.filter((item) =>
      item.toLowerCase().includes(sheetInput.toLowerCase())
    );
  }, [baseSuggestions, sheetInput]);

  /* ---------------- OPEN / CLOSE SHEET ---------------- */
  const openSheet = (type: "department" | "interest" | "email") => {
    setSheetType(type);
    setSheetInput("");
    setSheetVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  // ⚡ FAST CLOSE
  const closeSheet = () => {
    setSheetVisible(false);
    slideAnim.setValue(300);
  };

  /* ---------------- ADD ITEM ---------------- */
  const addItem = (raw: string) => {
    const value = raw.trim();
    if (!value) return;

    if (sheetType === "department") {
      setDepartments([value]); // only one department
    }

    else if (sheetType === "interest") {
      setInterests((prev) => [...new Set([...prev, value])]);
    }

    else if (sheetType === "email") {
      // 🔒 NEVER allow primary email
      if (
        primaryEmail &&
        value.toLowerCase() === primaryEmail.toLowerCase()
      ) {
        return;
      }

      setEmails((prev) => [...new Set([...prev, value])]);
    }

    closeSheet();
  };

  const handleSheetAddManual = () => addItem(sheetInput);

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    if (!current) return;

    setFullname(current.fullname ?? "");
    setYear(current.year ?? "");
    setBio(current.bio ?? "");

    setDepartments(current.departments ?? []);
    setInterests(current.interests ?? []);

    // ✅ ONLY secondary emails from Convex
    setEmails(current.emails ?? []);

    setImageUrl(current.image ?? undefined);
    setResumeUrl(current.resumeUrl ?? undefined);
  }, [current]);

  /* ---------------- IMAGE PICK & UPLOAD ---------------- */
  const openImageCropper = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow gallery access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled) return;

    const resized = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 512 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    const uploadUrl = await generateUploadUrl();
    const blob = await (await fetch(resized.uri)).blob();

    const res = await fetch(uploadUrl, { method: "POST", body: blob });
    const { storageId } = await res.json();
    const finalUrl = await getFileUrl({ storageId });

    setImageUrl(finalUrl ?? undefined);
  };

  /* ---------------- GENERIC UPLOADER ---------------- */
  const uploadToConvex = async (uri: string) => {
    const uploadUrl = await generateUploadUrl();
    const blob = await (await fetch(uri)).blob();

    const res = await fetch(uploadUrl, { method: "POST", body: blob });
    const { storageId } = await res.json();
    const finalUrl = await getFileUrl({ storageId });

    return { finalUrl };
  };

  /* ---------------- SAVE PROFILE ---------------- */
  const saveProfile = async () => {
    if (!current) return;

    try {
      await updateProfile({
        fullname,
        bio,
        image: imageUrl,
        departments,
        interests,
        emails, // 🔥 secondary only
        resumeUrl,
        year,
      });

      setEditing(false);
      toast.show(
        { title: "Saved", message: "Profile updated successfully." },
        "success"
      );
    } catch {
      toast.show(
        { title: "Error", message: "Failed to save profile." },
        "error"
      );
    }
  };

  /* ================= RETURN ================= */
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

    primaryEmail, // 🔒 read-only

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

    openImageCropper,

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

    saveProfile,
    uploadToConvex,
    signOut,
  };
}
