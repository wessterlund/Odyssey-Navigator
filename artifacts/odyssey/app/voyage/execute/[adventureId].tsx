import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { apiBase, useApp } from "@/contexts/AppContext";
import { CameraModal, CapturedMedia } from "@/components/CameraModal";
import { MediaPreview } from "@/components/MediaPreview";
import * as Haptics from "expo-haptics";

interface Step {
  id: number;
  instruction: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  tip?: string;
  order: number;
}

interface Adventure {
  id: number;
  title: string;
  description?: string;
  steps: Step[];
}

interface VoyageLog {
  id: number;
  completionStatus: string;
  mediaUrl?: string;
  notes?: string;
  createdAt: string;
}

export default function VoyageExecuteScreen() {
  const colors = useColors();
  const router = useRouter();
  const { adventureId, voyageId } = useLocalSearchParams<{ adventureId: string; voyageId: string }>();
  const insets = useSafeAreaInsets();
  const { currentLearner } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [logs, setLogs] = useState<VoyageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [cameraVisible, setCameraVisible] = useState(false);
  const [evidenceMedia, setEvidenceMedia] = useState<{ uri: string; type: "image" | "video" } | null>(null);
  const [logging, setLogging] = useState(false);

  const onConfirmRef = useRef<(m: CapturedMedia) => void>(() => {});
  const onReplaceRef = useRef<(o: string, n: string) => void>(() => {});

  onConfirmRef.current = (media) => {
    setEvidenceMedia({ uri: media.uri, type: media.type });
    setCameraVisible(false);
  };

  onReplaceRef.current = (oldUri, newUri) => {
    setEvidenceMedia((prev) => (prev?.uri === oldUri ? { ...prev, uri: newUri } : prev));
  };

  const fetchData = useCallback(async () => {
    try {
      const [advRes, logsRes] = await Promise.all([
        fetch(`${apiBase()}/adventures/${adventureId}`),
        voyageId ? fetch(`${apiBase()}/voyage-paths/${voyageId}/logs/adventure/${adventureId}`) : null,
      ]);
      if (advRes.ok) setAdventure(await advRes.json());
      if (logsRes?.ok) setLogs(await logsRes.json());
    } finally {
      setLoading(false);
    }
  }, [adventureId, voyageId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submitLog = async (status: "completed" | "in_progress" | "skipped") => {
    if (!voyageId || !currentLearner) return;
    setLogging(true);
    try {
      const body: any = {
        voyagePathId: parseInt(voyageId),
        adventureId: parseInt(adventureId),
        learnerId: currentLearner.id,
        completionStatus: status,
        notes: notes.trim() || null,
        mediaUrl: evidenceMedia?.uri || null,
        mediaType: evidenceMedia?.type || null,
      };
      const res = await fetch(`${apiBase()}/voyage-paths/${voyageId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } finally {
      setLogging(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!adventure) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Adventure not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {adventure.title}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Execution Mode
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 140 }]}
      >
        {/* Adventure description */}
        {adventure.description && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="compass" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Mission</Text>
            </View>
            <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
              {adventure.description}
            </Text>
          </View>
        )}

        {/* Steps */}
        {adventure.steps.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Steps</Text>
            {adventure.steps.map((step, i) => (
              <View key={step.id} style={[styles.stepCard, { backgroundColor: colors.card }]}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepInstruction, { color: colors.foreground }]}>
                    {step.instruction}
                  </Text>
                  {step.tip && (
                    <Text style={[styles.stepTip, { color: colors.mutedForeground }]}>
                      💡 {step.tip}
                    </Text>
                  )}
                  {step.mediaUrl && (
                    <View style={styles.stepMedia}>
                      <MediaPreview
                        uri={step.mediaUrl}
                        type={step.mediaType}
                        style={styles.stepMediaEl}
                      />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Evidence Recording */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🎥 Record Evidence</Text>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            Optionally record video or take a photo showing the learner completing this adventure.
          </Text>

          {evidenceMedia ? (
            <View style={[styles.evidenceCard, { backgroundColor: colors.card }]}>
              <View style={styles.evidencePreview}>
                <MediaPreview
                  uri={evidenceMedia.uri}
                  type={evidenceMedia.type}
                  style={styles.evidenceMedia}
                />
              </View>
              <TouchableOpacity
                style={[styles.reRecordBtn, { borderColor: colors.border }]}
                onPress={() => setCameraVisible(true)}
              >
                <Ionicons name="videocam-outline" size={18} color={colors.foreground} />
                <Text style={[styles.reRecordText, { color: colors.foreground }]}>Re-record</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.recordBtn, { backgroundColor: "#EF4444" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setCameraVisible(true);
              }}
            >
              <Ionicons name="videocam" size={22} color="#fff" />
              <Text style={styles.recordBtnText}>Start Recording</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📝 Notes</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Add any observations, comments, or notes…"
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Past Logs */}
        {logs.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Previous Sessions</Text>
            {logs.map((log) => (
              <View key={log.id} style={[styles.pastLog, { backgroundColor: colors.card }]}>
                <View style={styles.pastLogHeader}>
                  <View
                    style={[
                      styles.pastLogDot,
                      {
                        backgroundColor:
                          log.completionStatus === "completed"
                            ? "#10B981"
                            : log.completionStatus === "skipped"
                            ? colors.mutedForeground
                            : colors.primary,
                      },
                    ]}
                  />
                  <Text style={[styles.pastLogStatus, { color: colors.foreground, textTransform: "capitalize" }]}>
                    {log.completionStatus.replace("_", " ")}
                  </Text>
                  <Text style={[styles.pastLogDate, { color: colors.mutedForeground }]}>
                    {new Date(log.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {log.notes && (
                  <Text style={[styles.pastLogNotes, { color: colors.mutedForeground }]}>
                    {log.notes}
                  </Text>
                )}
                {log.mediaUrl && (
                  <View style={[styles.pastLogMedia, { backgroundColor: `${colors.primary}12` }]}>
                    <Ionicons name="videocam-outline" size={14} color={colors.primary} />
                    <Text style={[styles.pastLogMediaText, { color: colors.primary }]}>Media attached</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Log action bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomInset + 8 },
        ]}
      >
        <TouchableOpacity
          style={[styles.skipBtn, { borderColor: colors.border }]}
          disabled={logging}
          onPress={() => submitLog("skipped")}
        >
          <Text style={[styles.skipBtnText, { color: colors.mutedForeground }]}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.inProgressBtn, { borderColor: colors.primary }]}
          disabled={logging}
          onPress={() => submitLog("in_progress")}
        >
          <Text style={[styles.inProgressBtnText, { color: colors.primary }]}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.completeBtn, { backgroundColor: "#10B981" }]}
          disabled={logging}
          onPress={() => submitLog("completed")}
        >
          {logging ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.completeBtnText}>Complete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onConfirm={(m) => onConfirmRef.current(m)}
        onReplace={(o, n) => onReplaceRef.current(o, n)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12 },
  scrollContent: { padding: 20, gap: 20 },
  card: { borderRadius: 16, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardDesc: { fontSize: 14, lineHeight: 21 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionDesc: { fontSize: 14, lineHeight: 20 },
  stepCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  stepContent: { flex: 1, gap: 6 },
  stepInstruction: { fontSize: 14, lineHeight: 21, fontWeight: "500" },
  stepTip: { fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  stepMedia: { borderRadius: 10, overflow: "hidden", height: 140 },
  stepMediaEl: StyleSheet.absoluteFillObject,
  evidenceCard: { borderRadius: 16, padding: 14, gap: 12 },
  evidencePreview: { borderRadius: 12, overflow: "hidden", height: 200 },
  evidenceMedia: StyleSheet.absoluteFillObject,
  reRecordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reRecordText: { fontSize: 14, fontWeight: "600" },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
  },
  recordBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  notesInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  pastLog: { borderRadius: 14, padding: 14, gap: 6 },
  pastLogHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  pastLogDot: { width: 8, height: 8, borderRadius: 4 },
  pastLogStatus: { fontSize: 14, fontWeight: "600", flex: 1 },
  pastLogDate: { fontSize: 12 },
  pastLogNotes: { fontSize: 13, fontStyle: "italic" },
  pastLogMedia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  pastLogMediaText: { fontSize: 12, fontWeight: "600" },
  bottomBar: {
    flexDirection: "row",
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
  },
  skipBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  skipBtnText: { fontSize: 13, fontWeight: "600" },
  inProgressBtn: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  inProgressBtnText: { fontSize: 13, fontWeight: "700" },
  completeBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  completeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
