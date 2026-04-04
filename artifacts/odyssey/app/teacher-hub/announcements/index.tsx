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

type Announcement = {
  id: number;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  classTag: string | null;
  isDraft: boolean;
  createdAt: string;
};

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start) return "";
  if (!end || end === start) return start;
  return `${start} – ${end}`;
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start) return "";
  if (!end) return start;
  return `${start} – ${end}`;
}

export default function AnnouncementsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top + 12;

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [classTag, setClassTag] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/announcements`);
      const data: Announcement[] = await res.json();
      setItems(data.reverse());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setStartDate(""); setEndDate("");
    setStartTime(""); setEndTime(""); setClassTag("");
  };

  const handleSave = async (draft: boolean) => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          startDate: startDate.trim() || undefined,
          endDate: endDate.trim() || undefined,
          startTime: startTime.trim() || undefined,
          endTime: endTime.trim() || undefined,
          classTag: classTag.trim() || undefined,
          isDraft: draft,
        }),
      });
      await fetchItems();
      setShowCreate(false);
      resetForm();
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Announcements</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCreate(true); }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2F80ED" />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              No announcements yet. Tap + to create one.
            </Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.card }]}>
                {item.isDraft && (
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftText}>Draft</Text>
                  </View>
                )}
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                {item.description ? (
                  <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <View style={styles.cardMeta}>
                  {formatDateRange(item.startDate, item.endDate) ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {formatDateRange(item.startDate, item.endDate)}
                      </Text>
                    </View>
                  ) : null}
                  {formatTimeRange(item.startTime, item.endTime) ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {formatTimeRange(item.startTime, item.endTime)}
                      </Text>
                    </View>
                  ) : null}
                  {item.classTag ? (
                    <View style={styles.classTag}>
                      <Text style={styles.classTagText}>{item.classTag}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Create Announcement Sheet */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowCreate(false)} />
          <ScrollView style={[styles.sheet, { backgroundColor: colors.background }]} contentContainerStyle={{ gap: 10, paddingBottom: 40 }}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Create Announcement</Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Title</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="Announcement title"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Description</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextArea, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="Add a description…"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Start Date</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedForeground}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>End Date</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedForeground}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Start Time</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.mutedForeground}
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>End Time</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.mutedForeground}
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Class</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground }]}
              placeholder="e.g. SNED 1"
              placeholderTextColor={colors.mutedForeground}
              value={classTag}
              onChangeText={setClassTag}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.draftBtn, { borderColor: "#D1D5DB" }]}
                onPress={() => handleSave(true)}
                disabled={saving}
              >
                <Text style={[styles.draftBtnText, { color: colors.foreground }]}>Save as draft</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.publishBtn, saving && { opacity: 0.6 }]}
                onPress={() => handleSave(false)}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.publishBtnText}>Publish</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  list: { paddingHorizontal: 16, paddingVertical: 16, gap: 12, paddingBottom: 40 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },

  card: {
    borderRadius: 16, padding: 16, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  draftBadge: { backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  draftText: { fontSize: 11, fontWeight: "700", color: "#D97706" },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
  classTag: { backgroundColor: "#EBF3FF", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  classTagText: { fontSize: 11, fontWeight: "700", color: "#2F80ED" },

  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  overlayBg: { ...StyleSheet.absoluteFillObject },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 16, maxHeight: "90%" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  fieldInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  fieldTextArea: { minHeight: 80, textAlignVertical: "top" },
  twoCol: { flexDirection: "row", gap: 10 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  draftBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, alignItems: "center" },
  draftBtnText: { fontWeight: "700", fontSize: 15 },
  publishBtn: { flex: 1, backgroundColor: "#2F80ED", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  publishBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
