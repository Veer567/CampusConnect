import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

// RESPONSIVE HELPERS
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

interface ProfileContentProps {
  emails: string[];
  departments: string[];
  interests: string[];
  resumeUrl?: string;
  editing: boolean;
  setEmails: (emails: string[] | ((prev: string[]) => string[])) => void;
  openSheet: (type: "email" | "department" | "interest") => void;
  removeEmail: (index: number) => void;
  removeDepartment: (index: number) => void;
  removeInterest: (index: number) => void;
  pickResume: () => void;
}

export function ProfileContent(props: ProfileContentProps) {
  const {
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
  } = props;

  return (
    <>
      {/* ===== INFO BOX ===== */}
      <View style={styles.card}>
        {/* Primary Email */}
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={18} color={COLORS.primary} />

          {editing ? (
            <TextInput
              value={emails[0] ?? ""}
              onChangeText={(t) => setEmails([t, ...emails.slice(1)])}
              placeholder="Primary email *"
              style={styles.inputUnderline}
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.textMain}>
              {emails[0] ?? "—"}{" "}
              {emails[0] && (
                <Text style={{ color: COLORS.primary }}>(Primary)</Text>
              )}
            </Text>
          )}
        </View>

        {/* Additional Emails */}
        {emails.slice(1).length > 0 ? (
          <View style={styles.listWrapper}>
            {emails.slice(1).map((email, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.listText}>{email}</Text>
                {editing && (
                  <TouchableOpacity onPress={() => removeEmail(i + 1)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : (
          editing && <Text style={styles.placeholder}>No additional emails</Text>
        )}

        {/* Department */}
        <View style={styles.row}>
          <Ionicons name="school-outline" size={18} color={COLORS.primary} />

          {editing ? (
            <TouchableOpacity onPress={() => openSheet("department")}>
              <Text style={styles.selectText}>
                {departments[0] ?? "Pick Department"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.textMain}>{departments[0] ?? "—"}</Text>
          )}
        </View>

        {/* Resume */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => resumeUrl && Linking.openURL(resumeUrl)}
        >
          <Ionicons name="link-outline" size={18} color={COLORS.blue} />
          <Text style={styles.resumeLink}>
            {resumeUrl ? "View Resume" : editing ? "Upload Resume" : "No Resume"}
          </Text>
        </TouchableOpacity>

        {/* Editing Actions */}
        {editing && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={pickResume}>
              <Text style={styles.actionText}>Upload Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => openSheet("email")}>
              <Text style={styles.actionText}>Add Email</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ===== INTERESTS ===== */}
      <Section
        title="Interests"
        items={interests}
        editing={editing}
        onAdd={() => openSheet("interest")}
        onRemove={removeInterest}
      />

      {/* ===== DEPARTMENTS ===== */}
      <Section
        title="Departments"
        items={departments}
        editing={editing}
        onAdd={() => openSheet("department")}
        onRemove={removeDepartment}
      />
    </>
  );
}

/* Reusable Section Component */
function Section({
  title,
  items,
  editing,
  onAdd,
  onRemove,
}: {
  title: string;
  items: string[];
  editing: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <View style={{ marginTop: hp(2) }}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {editing && (
          <TouchableOpacity onPress={onAdd}>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Items */}
      <View style={styles.tagWrapper}>
        {items.length === 0 && !editing ? (
          <Text style={styles.placeholder}>No {title.toLowerCase()} added</Text>
        ) : (
          items.map((item, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
              {editing && (
                <TouchableOpacity onPress={() => onRemove(i)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Card */
  card: {
    marginTop: hp(1.5),
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: wp(4),
    marginHorizontal: wp(1),
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  /* Row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
    marginBottom: hp(1),
  },

  /* Text */
  textMain: {
    color: "#333",
    fontSize: wp(3.8),
    flex: 1,
  },

  inputUnderline: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 4,
    flex: 1,
    fontSize: wp(3.8),
  },

  selectText: {
    color: COLORS.primary,
    fontSize: wp(3.8),
  },

  resumeLink: {
    color: COLORS.blue,
    fontSize: wp(3.8),
  },

  placeholder: {
    color: "#aaa",
    fontSize: wp(3.3),
    fontStyle: "italic",
    marginTop: hp(0.6),
  },

  /* List Items */
  listWrapper: { marginTop: hp(1), gap: hp(0.6) },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fbff",
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: 8,
  },

  listText: {
    color: "#555",
    fontSize: wp(3.6),
    flex: 1,
  },

  removeText: {
    color: "red",
    fontWeight: "600",
  },

  /* Action Buttons */
  actionRow: {
    marginTop: hp(1.2),
    flexDirection: "row",
    flexWrap: "wrap",
    gap: wp(2),
  },

  actionBtn: {
    borderRadius: 10,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },

  actionText: {
    color: COLORS.primary,
    fontSize: wp(3.6),
  },

  /* SECTION */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    color: COLORS.primary,
    fontSize: wp(4.5),
    fontWeight: "700",
  },

  addText: {
    color: COLORS.primary,
    fontSize: wp(3.7),
  },

  tagWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: wp(2),
    marginTop: hp(1),
  },

  tag: {
    backgroundColor: "#f3f7ff",
    borderRadius: 20,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderWidth: 1,
    borderColor: COLORS.secondary,
    flexDirection: "row",
    alignItems: "center",
  },

  tagText: {
    color: COLORS.secondary,
    fontWeight: "600",
    fontSize: wp(3.6),
  },
});
