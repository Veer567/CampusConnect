// components/Profile/ProfileContent.tsx

import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useRef, useEffect, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
} from "react-native";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

/*──────────────────────────────
  Subtle Toast (clean version)
──────────────────────────────*/
const Toast = ({ visible, message }: { visible: boolean; message: string }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }, 1800);
    }
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

/*──────────────────────────────
  Soft-press animation
──────────────────────────────*/
const SoftPress = ({ children, style }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 80,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} style={style}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

/*──────────────────────────────
  MAIN COMPONENT
──────────────────────────────*/
export default function ProfileContent({
  emails,
  departments,
  interests,
  resumeUrl,
  editing,
  setEmails,
  openSheet,
  removeEmail,
  removeDepartment,
  removeInterest,
  pickResume,
}: any) {
  const [toast, setToast] = useState(false);
  const showSaved = () => setToast(true);

  return (
    <>
      {/* BASIC INFO CARD */}
      <View style={styles.infoCard}>
        {/* Primary Email */}
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={18} color={COLORS.primary} />

          {editing ? (
            <TextInput
              placeholder="Primary email"
              value={emails[0] ?? ""}
              style={styles.input}
              onChangeText={(t) => setEmails([t, ...emails.slice(1)])}
            />
          ) : (
            <Text style={styles.text}>{emails[0] ?? "—"}</Text>
          )}
        </View>

        {/* Additional emails */}
        {emails.slice(1).map((email: string, i: number) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.subItem}>{email}</Text>
            {editing && (
              <TouchableOpacity onPress={() => removeEmail(i + 1)}>
                <Ionicons name="close" size={18} color="#ff4d4d" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Department */}
        <View style={[styles.row, { marginTop: hp(1) }]}>
          <Ionicons
            name="school-outline"
            size={18}
            color={COLORS.primary}
          />
          <TouchableOpacity
            disabled={!editing}
            onPress={() => openSheet("department")}
          >
            <Text style={styles.text}>
              {departments[0] ?? (editing ? "Pick Department" : "—")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resume */}
        <TouchableOpacity
          style={[styles.row, { marginTop: hp(1) }]}
          onPress={() => resumeUrl && Linking.openURL(resumeUrl)}
        >
          <Ionicons name="document-outline" size={18} color={COLORS.blue} />
          <Text style={[styles.text, { color: COLORS.blue }]}>
            {resumeUrl ? "View Resume" : editing ? "Upload Resume" : "No Resume"}
          </Text>
        </TouchableOpacity>

        {editing && (
          <View style={styles.smallBtnRow}>
            <TouchableOpacity style={styles.smallBtn} onPress={pickResume}>
              <Text style={styles.smallBtnText}>Upload Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => openSheet("email")}
            >
              <Text style={styles.smallBtnText}>Add Email</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* INTERESTS */}
      <Section
        title="Interests"
        items={interests}
        editing={editing}
        onAdd={() => openSheet("interest")}
        onRemove={removeInterest}
      />

      {/* DEPARTMENT LIST */}
      <Section
        title="Departments"
        items={departments}
        editing={editing}
        onAdd={() => openSheet("department")}
        onRemove={removeDepartment}
      />

      {/* Toast */}
      <Toast visible={toast} message="Saved successfully" />
    </>
  );
}

/*──────────────────────────────
  CLEAN SECTION (LinkedIn style)
──────────────────────────────*/
function Section({ title, items, editing, onAdd, onRemove }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {editing && (
          <TouchableOpacity onPress={onAdd}>
            <Text style={styles.add}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tagContainer}>
        {items.map((item: string, i: number) => (
          <SoftPress key={i} style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
            {editing && (
              <TouchableOpacity onPress={() => onRemove(i)}>
                <Ionicons name="close" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </SoftPress>
        ))}

        {items.length === 0 && !editing && (
          <Text style={styles.emptyText}>No {title.toLowerCase()} added</Text>
        )}
      </View>
    </View>
  );
}

/*──────────────────────────────
  STYLES
──────────────────────────────*/
const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: "#fff",
    padding: wp(4),
    borderRadius: 12,
    marginTop: hp(1),
    marginHorizontal: wp(1),
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
  },

  text: {
    fontSize: wp(3.7),
    color: COLORS.text,
  },

  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    fontSize: wp(3.7),
    paddingVertical: 3,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(0.8),
  },

  subItem: {
    fontSize: wp(3.5),
    color: "#555",
  },

  smallBtnRow: {
    flexDirection: "row",
    marginTop: hp(1.5),
    gap: wp(2),
  },

  smallBtn: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.7),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  smallBtnText: {
    fontSize: wp(3.5),
    color: COLORS.primary,
  },

  /* Section */
  section: {
    marginTop: hp(2),
    marginHorizontal: wp(1),
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp(1),
  },

  sectionTitle: {
    fontSize: wp(4),
    fontWeight: "700",
    color: COLORS.primary,
  },

  add: {
    fontSize: wp(3.7),
    color: COLORS.blue,
  },

  /* Tags */
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: wp(2),
  },

  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: 20,
    backgroundColor: "#f1f3f5",
    gap: wp(1.5),
  },

  tagText: {
    fontSize: wp(3.5),
    color: "#333",
  },

  emptyText: {
    fontSize: wp(3.4),
    color: "#999",
  },

  toast: {
    position: "absolute",
    bottom: hp(6),
    left: wp(10),
    right: wp(10),
    padding: wp(3),
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 10,
    alignItems: "center",
  },

  toastText: {
    color: "#fff",
    fontSize: wp(3.5),
  },
});
