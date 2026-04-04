import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase, Adventure } from "@/contexts/AppContext";
import { CoinBadge } from "@/components/CoinBadge";
import { MediaPreview } from "@/components/MediaPreview";
import * as Haptics from "expo-haptics";

export default function AdventureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, loadAdventures } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchAdventure();
  }, [id]);

  const fetchAdventure = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/adventures/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setAdventure(data);
    } catch {
      Alert.alert("Error", "Could not load adventure.");
      router.back();
    }
    setLoading(false);
  };

  const deleteAdventure = async () => {
    setDeleting(true);
    try {
      await fetch(`${apiBase()}/adventures/${id}`, { method: "DELETE" });
      if (currentLearner) await loadAdventures(currentLearner.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.back();
    } catch {
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const duplicateAdventure = async () => {
    if (!adventure || !currentLearner) return;
    setDuplicating(true);
    try {
      const res = await fetch(`${apiBase()}/adventures/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId: currentLearner.id }),
      });
      if (!res.ok) throw new Error("Failed to duplicate");
      const newAdventure = await res.json();
      await loadAdventures(currentLearner.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Duplicated!", `"${adventure.title} (Copy)" created.`, [
        { text: "View copy", onPress: () => router.replace(`/adventure/${newAdventure.id}`) },
        { text: "Stay here", style: "cancel" },
      ]);
    } catch {
      Alert.alert("Error", "Failed to duplicate adventure.");
    }
    setDuplicating(false);
  };

  const toggleTemplate = async () => {
    if (!adventure) return;
    try {
      await fetch(`${apiBase()}/adventures/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTemplate: !adventure.isTemplate }),
      });
      setAdventure((prev) => prev ? { ...prev, isTemplate: !prev.isTemplate } : null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert("Error", "Failed to update.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!adventure) return null;

  const totalCoins = (adventure.steps?.length ?? 0) * adventure.coinsPerStep + adventure.completionBonus;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={duplicateAdventure}
            disabled={duplicating}
            style={styles.headerActionBtn}
          >
            {duplicating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="copy-outline" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTemplate} style={styles.headerActionBtn}>
            <Ionicons
              name={adventure.isTemplate ? "bookmark" : "bookmark-outline"}
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
          {confirmDelete ? (
            <View style={styles.inlineConfirm}>
              <TouchableOpacity onPress={() => setConfirmDelete(false)} style={styles.inlineCancelBtn}>
                <Text style={[styles.inlineCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deleteAdventure} disabled={deleting} style={styles.inlineDeleteBtn}>
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.inlineDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setConfirmDelete(true)} style={styles.headerActionBtn}>
              <Ionicons name="trash-outline" size={22} color={colors.destructive} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}>
        <View>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground, flex: 1 }]}>{adventure.title}</Text>
            {adventure.isTemplate && (
              <View style={[styles.templateBadge, { backgroundColor: colors.secondary }]}>
                <Ionicons name="bookmark" size={12} color={colors.primary} />
                <Text style={[styles.templateBadgeText, { color: colors.primary }]}>Template</Text>
              </View>
            )}
          </View>
          {adventure.description && (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {adventure.description}
            </Text>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaItem, { backgroundColor: colors.secondary }]}>
            <Ionicons name="star" size={16} color={colors.coin} />
            <Text style={[styles.metaText, { color: colors.primary }]}>
              {adventure.coinsPerStep} per step
            </Text>
          </View>
          <View style={[styles.metaItem, { backgroundColor: colors.secondary }]}>
            <Ionicons name="trophy" size={16} color={colors.coin} />
            <Text style={[styles.metaText, { color: colors.primary }]}>
              +{adventure.completionBonus} bonus
            </Text>
          </View>
          <View style={[styles.metaItem, { backgroundColor: colors.coinBg }]}>
            <Text style={[styles.metaText, { color: colors.coin }]}>
              {totalCoins} total
            </Text>
          </View>
          {(adventure.usageCount ?? 0) > 0 && (
            <View style={[styles.metaItem, { backgroundColor: colors.secondary }]}>
              <Ionicons name="refresh" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>
                Used {adventure.usageCount}x
              </Text>
            </View>
          )}
        </View>

        {adventure.lastCompletedAt && (
          <Text style={[styles.lastCompleted, { color: colors.mutedForeground }]}>
            Last completed: {new Date(adventure.lastCompletedAt).toLocaleDateString()}
          </Text>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {adventure.steps?.length ?? 0} Steps
          </Text>
          {(adventure.steps || []).map((step, index) => (
            <View key={step.id ?? index} style={[styles.stepCard, { backgroundColor: colors.card }]}>
              {step.mediaUrl ? (
                <MediaPreview
                  uri={step.mediaUrl}
                  mediaType={step.mediaType ?? "image"}
                  style={styles.stepMedia}
                />
              ) : null}
              <View style={styles.stepCardContent}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={[styles.stepText, { color: colors.foreground }]}>
                    {step.instruction}
                  </Text>
                  {step.tip && (
                    <View style={[styles.tipBox, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="information-circle" size={14} color={colors.primary} />
                      <Text style={[styles.tipText, { color: colors.primary }]}>{step.tip}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.startBar,
          { paddingBottom: bottomInset + 16, backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push(`/child-mode/${adventure.id}`);
          }}
        >
          <Ionicons name="play" size={22} color={colors.primaryForeground} />
          <Text style={[styles.startBtnText, { color: colors.primaryForeground }]}>
            Start Adventure
          </Text>
          <CoinBadge amount={totalCoins} size="sm" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerActions: { flexDirection: "row", gap: 4 },
  headerActionBtn: { padding: 8 },
  content: { paddingHorizontal: 20, gap: 20, paddingTop: 8 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  title: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  description: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  templateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  templateBadgeText: { fontSize: 11, fontWeight: "700" },
  lastCompleted: { fontSize: 12, marginTop: -8 },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  metaText: { fontSize: 13, fontWeight: "600" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  stepCard: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stepMedia: { width: "100%", height: 160 },
  stepCardContent: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepNumText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  stepContentCol: { flex: 1, gap: 8 },
  stepText: { fontSize: 15, lineHeight: 22 },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 8, borderRadius: 8 },
  tipText: { fontSize: 12, flex: 1, lineHeight: 17 },
  startBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
  },
  startBtnText: { fontSize: 18, fontWeight: "700" },
  inlineConfirm: { flexDirection: "row", alignItems: "center", gap: 6 },
  inlineCancelBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  inlineCancelText: { fontSize: 13, fontWeight: "600" },
  inlineDeleteBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 56,
    alignItems: "center",
  },
  inlineDeleteText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
