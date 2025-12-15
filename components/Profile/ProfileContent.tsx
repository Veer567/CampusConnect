import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

/*──────────────────────────────
  Toast
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
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

/*──────────────────────────────
  Soft Press
──────────────────────────────*/
const SoftPress = ({ children, style }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={() =>
          Animated.timing(scale, {
            toValue: 0.97,
            duration: 80,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.timing(scale, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }).start()
        }
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

/*──────────────────────────────
  Department Section (SINGLE source)
──────────────────────────────*/
function SingleDepartment({
  department,
  editing,
  onSelect,
}: {
  department?: string;
  editing: boolean;
  onSelect: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Department</Text>

        {editing && (
          <TouchableOpacity onPress={onSelect}>
            <Text style={styles.add}>{department ? "Change" : "Pick"}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tagContainer}>
        {department ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{department}</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No department selected</Text>
        )}
      </View>
    </View>
  );
}

/*──────────────────────────────
  Generic Section
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
  removeInterest,
  pickResume,
}: any) {
  const [toast, setToast] = useState(false);

  return (
    <>
      {/* BASIC INFO */}
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

        {/* Resume */}
        <TouchableOpacity
          style={[styles.row, { marginTop: hp(1) }]}
          onPress={() => resumeUrl && Linking.openURL(resumeUrl)}
        >
          <Ionicons name="document-outline" size={18} color={COLORS.blue} />
          <Text style={[styles.text, { color: COLORS.blue }]}>
            {resumeUrl
              ? "View Resume"
              : editing
                ? "Upload Resume"
                : "No Resume"}
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

      {/* ✅ SINGLE DEPARTMENT SECTION (FIXED) */}
      <SingleDepartment
        department={departments[0]}
        editing={editing}
        onSelect={() => openSheet("department")}
      />

      {/* Toast */}
      <Toast visible={toast} message="Saved successfully" />
    </>
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
