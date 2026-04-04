import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import TeacherHome from "@/components/home/TeacherHome";
import ParentHome from "@/components/home/ParentHome";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role, setRole } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const isTeacher = role === "teacher";

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRole(isTeacher ? "parent" : "teacher");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Super Admin Role Toggle — sits at top, inside safe area */}
      <View style={[styles.adminBar, { paddingTop: topInset, backgroundColor: "#1E293B" }]}>
        <View style={styles.adminLeft}>
          <Ionicons name="shield-checkmark" size={12} color="#94A3B8" />
          <Text style={styles.adminLabel}>Super Admin</Text>
        </View>
        <TouchableOpacity style={styles.toggleWrap} onPress={handleToggle} activeOpacity={0.8}>
          <View style={[styles.toggleTrack, { backgroundColor: isTeacher ? "#3B82F6" : "#A855F7" }]}>
            <View style={[styles.toggleKnob, isTeacher ? styles.knobLeft : styles.knobRight]}>
              <Text style={styles.knobEmoji}>{isTeacher ? "👩‍🏫" : "👪"}</Text>
            </View>
          </View>
          <Text style={styles.toggleLabel}>{isTeacher ? "Teacher View" : "Parent View"}</Text>
        </TouchableOpacity>
      </View>

      {/* Main content — no extra topInset needed since admin bar consumed it */}
      {isTeacher ? <TeacherHome topPadding={16} /> : <ParentHome topPadding={16} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  adminBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  adminLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  adminLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600", letterSpacing: 0.5 },
  toggleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleLabel: { fontSize: 11, color: "#E2E8F0", fontWeight: "600" },
  toggleTrack: { width: 52, height: 26, borderRadius: 13, justifyContent: "center", padding: 2 },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  knobLeft: { alignSelf: "flex-start" },
  knobRight: { alignSelf: "flex-end" },
  knobEmoji: { fontSize: 12 },
});
