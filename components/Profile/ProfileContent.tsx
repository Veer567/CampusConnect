// components/profile/ProfileContent.tsx
import { COLORS } from "@/constants/themes";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

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

export function ProfileContent({
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
}: ProfileContentProps) {
  return (
    <>
      {/* === INFO BOX === */}
      <View
        style={{
          marginTop: 14,
          backgroundColor: "#fff",
          borderRadius: 14,
          padding: 14,
          marginHorizontal: 6,
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Primary Email */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
          {editing ? (
            <TextInput
              value={emails[0] ?? ""}
              onChangeText={(t) => setEmails([t, ...emails.slice(1)])}
              placeholder="Primary email *"
              style={{
                borderBottomWidth: 1,
                borderColor: "#eee",
                paddingVertical: 4,
                flex: 1,
                fontSize: 15,
              }}
              autoCapitalize="none"
            />
          ) : (
            <Text style={{ color: "#333", fontSize: 15, flex: 1 }}>
              {emails[0] ?? "—"}{" "}
              {emails[0] && (
                <Text style={{ color: COLORS.primary }}>(Primary)</Text>
              )}
            </Text>
          )}
        </View>

        {/* Additional Emails */}
        {emails.slice(1).length > 0 ? (
          <View style={{ marginTop: 8, gap: 6 }}>
            {emails.slice(1).map((email, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#f8fbff",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#555", fontSize: 14, flex: 1 }}>
                  {email}
                </Text>
                {editing && (
                  <TouchableOpacity onPress={() => removeEmail(i + 1)}>
                    <Text style={{ color: "red", fontWeight: "600" }}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : editing ? (
          <Text
            style={{
              color: "#aaa",
              fontSize: 13,
              marginTop: 8,
              fontStyle: "italic",
            }}
          >
            No additional emails
          </Text>
        ) : null}

        {/* Department */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginTop: 8,
          }}
        >
          <Ionicons name="school-outline" size={18} color={COLORS.primary} />
          {editing ? (
            <TouchableOpacity onPress={() => openSheet("department")}>
              <Text style={{ color: COLORS.primary, fontSize: 15 }}>
                {departments[0] ?? "Pick Department"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: "#333", fontSize: 15 }}>
              {departments[0] ?? "—"}
            </Text>
          )}
        </View>

        {/* Resume */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginTop: 12,
          }}
          onPress={() => resumeUrl && Linking.openURL(resumeUrl)}
        >
          <Ionicons name="link-outline" size={18} color={COLORS.blue} />
          <Text style={{ color: COLORS.blue, fontSize: 15 }}>
            {resumeUrl
              ? "View Resume"
              : editing
                ? "Upload Resume"
                : "No Resume"}
          </Text>
        </TouchableOpacity>

        {/* Edit Actions */}
        {editing && (
          <View
            style={{
              marginTop: 12,
              flexDirection: "row",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <TouchableOpacity
              onPress={pickResume}
              style={{
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#eee",
              }}
            >
              <Text style={{ color: COLORS.primary, fontSize: 14 }}>
                Upload Resume
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openSheet("email")}
              style={{
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#eee",
              }}
            >
              <Text style={{ color: COLORS.primary, fontSize: 14 }}>
                Add Email
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* === INTERESTS === */}
      <View style={{ marginTop: 18 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: COLORS.primary, fontSize: 18, fontWeight: "700" }}
          >
            Interests
          </Text>
          {editing && (
            <TouchableOpacity onPress={() => openSheet("interest")}>
              <Text style={{ color: COLORS.primary }}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
          }}
        >
          {interests.length === 0 && !editing ? (
            <Text style={{ color: "#666" }}>No interests added</Text>
          ) : (
            interests.map((t, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: "#f3f7ff",
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: COLORS.secondary,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: COLORS.secondary, fontWeight: "600" }}>
                  {t}
                </Text>
                {editing && (
                  <TouchableOpacity
                    onPress={() => removeInterest(i)}
                    style={{ marginLeft: 8 }}
                  >
                    <Text style={{ color: "red" }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </View>

      {/* === DEPARTMENTS === */}
      <View style={{ marginTop: 18 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: COLORS.primary, fontSize: 18, fontWeight: "700" }}
          >
            Departments
          </Text>
          {editing && (
            <TouchableOpacity onPress={() => openSheet("department")}>
              <Text style={{ color: COLORS.primary }}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
          }}
        >
          {departments.length === 0 && !editing ? (
            <Text style={{ color: "#666" }}>No department added</Text>
          ) : (
            departments.map((t, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: "#f3f7ff",
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: COLORS.secondary,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: COLORS.secondary, fontWeight: "600" }}>
                  {t}
                </Text>
                {editing && (
                  <TouchableOpacity
                    onPress={() => removeDepartment(i)}
                    style={{ marginLeft: 8 }}
                  >
                    <Text style={{ color: "red" }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </View>
    </>
  );
}
