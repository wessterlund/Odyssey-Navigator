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

  const deleteAdventure = () => {
    Alert.alert("Delete Adventure", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          await fetch(`${apiBase()}/adventures/${id}`, { method: "DELETE" });
          if (currentLearner) await loadAdventures(currentLearner.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={deleteAdventure} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color={colors.destructive} />
            ) : (
              <Ionicons name="trash-outline" size={22} color={colors.destructive} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}>
        {/* Title */}
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>{adventure.title}</Text>
          {adventure.description && (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {adventure.description}
            </Text>
          )}
        </View>

        {/* Meta */}
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
        </View>

        {/* Steps Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {adventure.steps?.length ?? 0} Steps
          </Text>
          {(adventure.steps || []).map((step, index) => (
            <View key={step.id ?? index} style={[styles.stepCard, { backgroundColor: colors.card }]}>
              <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumText}>{index + 1}</Text>
              </View>
              <View style={styles.stepContent}>
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
          ))}
        </View>
      </ScrollView>

      {/* Start Button */}
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
  headerActions: { flexDirection: "row", gap: 16 },
  content: { paddingHorizontal: 20, gap: 20, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  description: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  metaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  metaText: { fontSize: 13, fontWeight: "600" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  stepCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepNumText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  stepContent: { flex: 1, gap: 8 },
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
});
