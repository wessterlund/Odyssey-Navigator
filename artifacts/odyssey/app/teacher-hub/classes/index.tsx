import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Switch, ActivityIndicator, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type Class = {
  id: number;
  name: string;
  academicYear: string;
  isActive: boolean;
  learnerIds: number[];
};

export default function ClassesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top + 12;

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newYear, setNewYear] = useState("2024–2025");
  const [saving, setSaving] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Class | null>(null);
  const [successModal, setSuccessModal] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/classes`);
      setClasses(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const activeClasses = classes.filter((c) => c.isActive);
  const inactiveClasses = classes.filter((c) => !c.isActive);

  const handleToggle = async (cls: Class) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (cls.isActive) {
      setDeactivateTarget(cls);
    } else {
      await fetch(`${BASE}/classes/${cls.id}/toggle`, { method: "PUT" });
      fetchClasses();
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    await fetch(`${BASE}/classes/${deactivateTarget.id}/toggle`, { method: "PUT" });
    setDeactivateTarget(null);
    fetchClasses();
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), academicYear: newYear.trim() }),
      });
      await fetchClasses();
      setShowAdd(false);
      setNewName(""); setNewYear("2024–2025");
      setSuccessModal(true);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const ClassCard = ({ cls }: { cls: Class }) => (
    <View style={[styles.classCard, { backgroundColor: colors.card }]}>
      <View style={styles.classCardLeft}>
        <View style={styles.classIcon}>
          <Ionicons name="school" size={20} color="#2F80ED" />
        </View>
        <View style={styles.classInfo}>
          <Text style={[styles.className, { color: colors.foreground }]}>{cls.name}</Text>
          <Text style={[styles.classMeta, { color: colors.mutedForeground }]}>
            {cls.academicYear} · {cls.learnerIds.length} student{cls.learnerIds.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <Switch
        value={cls.isActive}
        onValueChange={() => handleToggle(cls)}
        trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
        thumbColor={cls.isActive ? "#2F80ED" : "#9CA3AF"}
      />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Classes</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2F80ED" />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Active */}
          <Text style={[styles.sectionLabel, { color: "#2F80ED" }]}>Active</Text>
          {activeClasses.length === 0 ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>No active classes.</Text>
          ) : (
            activeClasses.map((cls) => <ClassCard key={cls.id} cls={cls} />)
          )}

          {/* Inactive */}
          {inactiveClasses.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>Inactive</Text>
              {inactiveClasses.map((cls) => <ClassCard key={cls.id} cls={cls} />)}
            </>
          )}
        </ScrollView>
      )}

      {/* Add Class Sheet */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowAdd(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Class</Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Section Name</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="e.g. SNED Section 1"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Academic Year</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="e.g. 2024–2025"
              placeholderTextColor={colors.mutedForeground}
              value={newYear}
              onChangeText={setNewYear}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Class</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Deactivate Confirm */}
      <Modal visible={!!deactivateTarget} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.confirmModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Deactivate this class?</Text>
            <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>
              "{deactivateTarget?.name}" will be moved to inactive. Students remain unaffected.
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmNo} onPress={() => setDeactivateTarget(null)}>
                <Text style={[styles.confirmNoText, { color: colors.foreground }]}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={confirmDeactivate}>
                <Text style={styles.saveBtnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.confirmModal, { backgroundColor: colors.background }]}>
            <Text style={styles.resultEmoji}>🏫</Text>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Class created!</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setSuccessModal(false)}>
              <Text style={styles.saveBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(0,0,0,0.08)",
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700" },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2F80ED", alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  empty: { fontSize: 13, fontStyle: "italic" },

  classCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  classCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  classIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EBF3FF", alignItems: "center", justifyContent: "center" },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: "700" },
  classMeta: { fontSize: 12, marginTop: 2 },

  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  overlayBg: { ...StyleSheet.absoluteFillObject },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 10 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  fieldInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  saveBtn: { backgroundColor: "#2F80ED", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8, flex: 1 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  confirmModal: {
    margin: 32, borderRadius: 24, padding: 24, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  confirmTitle: { fontSize: 17, fontWeight: "800" },
  confirmBody: { fontSize: 13, lineHeight: 19 },
  confirmBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  confirmNo: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: "#D1D5DB", paddingVertical: 14, alignItems: "center" },
  confirmNoText: { fontWeight: "700", fontSize: 15 },
  resultEmoji: { fontSize: 40, textAlign: "center" },
});
