// components/profile/ProfileContent.tsx
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import * as Linking from "expo-linking";

export function ProfileContent({
  emails, departments, interests, resumeUrl, editing,
  setEmails, openSheet, removeEmail, removeDepartment, removeInterest,
  pickResume
}: any) {
  return (
    <>
      <View style={{ marginTop: 14, backgroundColor: "#fff", borderRadius: 14, padding: 14, marginHorizontal: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
          {editing ? (
            <TextInput
              value={emails[0] ?? ""}
              onChangeText={t => setEmails([t, ...emails.slice(1)])}
              style={{ borderBottomWidth: 1, borderColor: "#eee", paddingVertical: 4, flex: 1 }}
            />
          ) : (
            <Text style={{ color: "#333", fontSize: 15 }}>{emails[0] ?? "—"}</Text>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Ionicons name="school-outline" size={18} color={COLORS.primary} />
          {editing ? (
            <TouchableOpacity onPress={() => openSheet("department")}>
              <Text style={{ color: COLORS.primary, fontSize: 15 }}>{departments[0] ?? "Pick Department"}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: "#333", fontSize: 15 }}>{departments[0] ?? "—"}</Text>
          )}
        </View>

        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          onPress={() => resumeUrl && Linking.openURL(resumeUrl)}
        >
          <Ionicons name="link-outline" size={18} color={COLORS.blue} />
          <Text style={{ color: COLORS.blue, fontSize: 15 }}>
            {resumeUrl ? "View Resume" : editing ? "Upload Resume" : "No Resume"}
          </Text>
        </TouchableOpacity>

        {editing && (
          <View style={{ marginTop: 10, flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={pickResume} style={{ borderRadius: 10, padding: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" }}>
              <Text style={{ color: COLORS.primary }}>Upload Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openSheet("email")} style={{ borderRadius: 10, padding: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" }}>
              <Text style={{ color: COLORS.primary }}>Add Email</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Interests */}
      <View style={{ marginTop: 18 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: "700" }}>Interests</Text>
          {editing && <TouchableOpacity onPress={() => openSheet("interest")}><Text style={{ color: COLORS.primary }}>+ Add</Text></TouchableOpacity>}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {interests.length === 0 && !editing ? (
            <Text style={{ color: "#666" }}>No interests added</Text>
          ) : (
            interests.map((t: string, i: number) => (
              <View key={i} style={{ backgroundColor: "#f3f7ff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.secondary, flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: COLORS.secondary, fontWeight: "600" }}>{t}</Text>
                {editing && <TouchableOpacity onPress={() => removeInterest(i)} style={{ marginLeft: 8 }}><Text style={{ color: "red" }}>Remove</Text></TouchableOpacity>}
              </View>
            ))
          )}
        </View>
      </View>

      {/* Departments */}
      <View style={{ marginTop: 18 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: "700" }}>Departments</Text>
          {editing && <TouchableOpacity onPress={() => openSheet("department")}><Text style={{ color: COLORS.primary }}>+ Add</Text></TouchableOpacity>}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {departments.length === 0 && !editing ? (
            <Text style={{ color: "#666" }}>No department added</Text>
          ) : (
            departments.map((t: string, i: number) => (
              <View key={i} style={{ backgroundColor: "#f3f7ff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.secondary, flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: COLORS.secondary, fontWeight: "600" }}>{t}</Text>
                {editing && <TouchableOpacity onPress={() => removeDepartment(i)} style={{ marginLeft: 8 }}><Text style={{ color: "red" }}>Remove</Text></TouchableOpacity>}
              </View>
            ))
          )}
        </View>
      </View>
    </>
  );
}