import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import TeacherHome from "@/components/home/TeacherHome";
import ParentHome from "@/components/home/ParentHome";
import StudentHome from "@/components/home/StudentHome";
import * as Haptics from "expo-haptics";

const ROLES = [
  { key: "teacher", emoji: "👩‍🏫", label: "Teacher", color: "#3B82F6" },
  { key: "parent",  emoji: "👪",   label: "Parent",  color: "#A855F7" },
  { key: "student", emoji: "🎒",   label: "Student", color: "#10B981" },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role, setRole } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Super Admin Role Switcher ─────────────────── */}
      <View style={[styles.adminBar, { paddingTop: topInset, backgroundColor: "#1E293B" }]}>
        <View style={styles.adminLeft}>
          <Ionicons name="shield-checkmark" size={12} color="#94A3B8" />
          <Text style={styles.adminLabel}>Super Admin</Text>
        </View>

        {/* 3-segment pill selector */}
        <View style={styles.segmentRow}>
          {ROLES.map((r) => {
            const active = role === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.segment,
                  active && { backgroundColor: r.color },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setRole(r.key);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.segmentEmoji}>{r.emoji}</Text>
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── View Content ─────────────────────────────── */}
      {role === "teacher" && <TeacherHome topPadding={16} />}
      {role === "parent"  && <ParentHome  topPadding={16} />}
      {role === "student" && <StudentHome topPadding={16} />}
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

  /* 3-segment selector */
  segmentRow: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  segmentEmoji: { fontSize: 12 },
  segmentLabel: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  segmentLabelActive: { color: "#fff" },
});
