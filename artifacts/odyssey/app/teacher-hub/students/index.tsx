import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Platform, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type Learner = {
  id: number;
  name: string;
  class: string | null;
  birthday: string;
  diagnosis: string | null;
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function getProgress(id: number) {
  return [40, 60, 75, 90, 55, 80][id % 6];
}

const AVATAR_COLORS = ["#2F80ED", "#E07B6E", "#9B7FE0", "#4CAF50", "#F5A623", "#5B8AF0"];

export default function StudentsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top + 12;

  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState("");
  const [newSection, setNewSection] = useState("");
  const [saving, setSaving] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  const fetchLearners = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/learners`);
      const data = await res.json();
      setLearners(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLearners(); }, [fetchLearners]);

  const filtered = learners.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`${BASE}/learners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          birthday: today,
          class: newSection.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchLearners();
      setShowAdd(false);
      setNewName(""); setNewParent(""); setNewSection("");
      setSuccessModal(true);
    } catch {
      setErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Students</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search students…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2F80ED" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              {search ? "No students match your search." : "No students yet. Tap + to add one."}
            </Text>
          ) : (
            filtered.map((learner) => {
              const progress = getProgress(learner.id);
              const avatarColor = AVATAR_COLORS[learner.id % AVATAR_COLORS.length];
              return (
                <TouchableOpacity
                  key={learner.id}
                  style={[styles.card, { backgroundColor: colors.card }]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/profile/${learner.id}` as any)}
                >
                  <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarText}>{getInitials(learner.name)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.studentName, { color: colors.foreground }]}>{learner.name}</Text>
                    <Text style={[styles.studentMeta, { color: colors.mutedForeground }]}>
                      {learner.class ? `Section ${learner.class}` : "No section"}
                    </Text>
                    <View style={styles.progressRow}>
                      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                        <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: "#2F80ED" }]} />
                      </View>
                      <Text style={[styles.progressPct, { color: colors.mutedForeground }]}>{progress}%</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Add Student Bottom Sheet */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowAdd(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Student</Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="Student name"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Parent / Guardian</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="Parent name"
              placeholderTextColor={colors.mutedForeground}
              value={newParent}
              onChangeText={setNewParent}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Section</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="e.g. SNED 1"
              placeholderTextColor={colors.mutedForeground}
              value={newSection}
              onChangeText={setNewSection}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Add Student</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.resultModal, { backgroundColor: colors.background }]}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>Student Added!</Text>
            <Text style={[styles.resultBody, { color: colors.mutedForeground }]}>
              Your new student has been successfully added.
            </Text>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setSuccessModal(false)}>
              <Text style={styles.saveBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={errorModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.resultModal, { backgroundColor: colors.background }]}>
            <Text style={styles.resultEmoji}>⚠️</Text>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>Something went wrong</Text>
            <Text style={[styles.resultBody, { color: colors.mutedForeground }]}>
              We couldn't add the student. Please try again.
            </Text>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setErrorModal(false)}>
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
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#2F80ED", alignItems: "center", justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginVertical: 12,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  scroll: { flex: 1 },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 40 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  cardInfo: { flex: 1, gap: 3 },
  studentName: { fontSize: 15, fontWeight: "700" },
  studentMeta: { fontSize: 12 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  progressPct: { fontSize: 11, fontWeight: "700", minWidth: 30, textAlign: "right" },

  /* Modals */
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  overlayBg: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 10,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  fieldInput: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#2F80ED", borderRadius: 14,
    paddingVertical: 14, alignItems: "center", marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  resultModal: {
    margin: 40, borderRadius: 24, padding: 28, alignItems: "center", gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  resultEmoji: { fontSize: 48 },
  resultTitle: { fontSize: 18, fontWeight: "800" },
  resultBody: { fontSize: 13, textAlign: "center", lineHeight: 19 },
});
