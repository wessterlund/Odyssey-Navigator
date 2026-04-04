import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type Parent = { id: number; name: string; email: string | null; phone: string | null; learnerIds: number[] };
type Learner = { id: number; name: string; class: string | null };

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = ["#9B7FE0", "#2F80ED", "#4CAF50", "#F5A623", "#E07B6E", "#5B8AF0"];

export default function ParentsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top + 12;

  const [parents, setParents] = useState<Parent[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Parent | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);

  /* Explorer Log state */
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDate, setLogDate] = useState("");
  const [logActivity, setLogActivity] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logLearner, setLogLearner] = useState<number | null>(null);
  const [logSaving, setLogSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, lRes] = await Promise.all([
        fetch(`${BASE}/parents`),
        fetch(`${BASE}/learners`),
      ]);
      setParents(await pRes.json());
      setLearners(await lRes.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getLearnerName = (id: number) => learners.find((l) => l.id === id)?.name ?? `Student #${id}`;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/parents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
        }),
      });
      await fetchAll();
      setShowAdd(false);
      setNewName(""); setNewEmail(""); setNewPhone("");
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleAddLog = async () => {
    if (!logDate.trim() || !logActivity.trim() || !logLearner) return;
    setLogSaving(true);
    try {
      await fetch(`${BASE}/explorer-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: logLearner,
          logDate: logDate.trim(),
          activityName: logActivity.trim(),
          notes: logNotes.trim() || undefined,
        }),
      });
      setShowLogModal(false);
      setLogDate(""); setLogActivity(""); setLogNotes(""); setLogLearner(null);
    } catch { /* silent */ }
    finally { setLogSaving(false); }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Parents</Text>
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {parents.length === 0 ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>No parents yet. Tap + to add one.</Text>
          ) : (
            parents.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.card, { backgroundColor: colors.card }]}
                activeOpacity={0.8}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(p); }}
              >
                <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[p.id % AVATAR_COLORS.length] }]}>
                  <Text style={styles.avatarText}>{getInitials(p.name)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.parentName, { color: colors.foreground }]}>{p.name}</Text>
                  {p.learnerIds.length > 0 ? (
                    <Text style={[styles.parentMeta, { color: colors.mutedForeground }]}>
                      {p.learnerIds.map(getLearnerName).join(", ")}
                    </Text>
                  ) : (
                    <Text style={[styles.parentMeta, { color: colors.mutedForeground }]}>No linked students</Text>
                  )}
                  {p.phone ? <Text style={[styles.parentContact, { color: colors.mutedForeground }]}>{p.phone}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Parent Detail Bottom Sheet */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setSelected(null)} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHandle} />
            {selected && (
              <>
                <View style={styles.detailHeader}>
                  <View style={[styles.detailAvatar, { backgroundColor: AVATAR_COLORS[selected.id % AVATAR_COLORS.length] }]}>
                    <Text style={styles.detailAvatarText}>{getInitials(selected.name)}</Text>
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={[styles.detailName, { color: colors.foreground }]}>{selected.name}</Text>
                    {selected.email ? <Text style={[styles.detailContact, { color: colors.mutedForeground }]}>{selected.email}</Text> : null}
                    {selected.phone ? <Text style={[styles.detailContact, { color: colors.mutedForeground }]}>{selected.phone}</Text> : null}
                  </View>
                </View>

                {selected.learnerIds.length > 0 && (
                  <View style={styles.linkedSection}>
                    <Text style={[styles.linkedTitle, { color: colors.foreground }]}>Linked Children</Text>
                    {selected.learnerIds.map((id) => (
                      <Text key={id} style={[styles.linkedChild, { color: colors.mutedForeground }]}>
                        • {getLearnerName(id)}
                      </Text>
                    ))}
                  </View>
                )}

                <Text style={[styles.sectionLabel, { color: "#2F80ED" }]}>Explorer Logs</Text>

                <View style={styles.actionGroup}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#EBF3FF" }]}
                    onPress={() => {
                      setLogLearner(selected.learnerIds[0] ?? null);
                      setShowLogModal(true);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#2F80ED" />
                    <Text style={[styles.actionBtnText, { color: "#2F80ED" }]}>Add new log</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#F3F0FF" }]}>
                    <Ionicons name="chatbubbles-outline" size={18} color="#9B7FE0" />
                    <Text style={[styles.actionBtnText, { color: "#9B7FE0" }]}>Create group chat</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Parent Sheet */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowAdd(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Parent</Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="Parent name"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="email@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              value={newEmail}
              onChangeText={setNewEmail}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Phone</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="+63 9XX XXX XXXX"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Parent</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Explorer Log Modal */}
      <Modal visible={showLogModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowLogModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add Explorer Log</Text>

            {learners.length > 0 && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Student</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {learners.map((l) => (
                    <TouchableOpacity
                      key={l.id}
                      style={[styles.learnerChip, logLearner === l.id && { backgroundColor: "#2F80ED" }]}
                      onPress={() => setLogLearner(l.id)}
                    >
                      <Text style={[styles.learnerChipText, logLearner === l.id && { color: "#fff" }]}>{l.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Date</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={logDate}
              onChangeText={setLogDate}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Activity</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="Activity name"
              placeholderTextColor={colors.mutedForeground}
              value={logActivity}
              onChangeText={setLogActivity}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextArea, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="Additional notes…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={logNotes}
              onChangeText={setLogNotes}
            />

            <TouchableOpacity
              style={[styles.saveBtn, logSaving && { opacity: 0.6 }]}
              onPress={handleAddLog}
              disabled={logSaving}
            >
              {logSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Log</Text>}
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
  list: { paddingHorizontal: 16, paddingVertical: 16, gap: 10, paddingBottom: 40 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },

  card: {
    flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  cardInfo: { flex: 1, gap: 2 },
  parentName: { fontSize: 15, fontWeight: "700" },
  parentMeta: { fontSize: 12 },
  parentContact: { fontSize: 12 },

  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  overlayBg: { ...StyleSheet.absoluteFillObject },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 10 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },

  detailHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  detailAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  detailAvatarText: { color: "#fff", fontWeight: "800", fontSize: 20 },
  detailInfo: { flex: 1, gap: 2 },
  detailName: { fontSize: 18, fontWeight: "800" },
  detailContact: { fontSize: 13 },

  linkedSection: { gap: 4 },
  linkedTitle: { fontSize: 15, fontWeight: "700" },
  linkedChild: { fontSize: 13 },

  sectionLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },

  actionGroup: { gap: 10 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  actionBtnText: { fontSize: 14, fontWeight: "700" },

  fieldLabel: { fontSize: 13, fontWeight: "600" },
  fieldInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  fieldTextArea: { minHeight: 70, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#2F80ED", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  learnerChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#F3F4F6" },
  learnerChipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
});
