import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { apiBase, useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const PROMPT_LEVEL_COLORS: Record<string, string> = {
  "Full Physical": "#EF4444",
  "Partial Physical": "#F97316",
  "Gestural": "#EAB308",
  "Verbal": "#3B82F6",
  "Independent": "#22C55E",
};

function parsePromptLevel(tip: string): { promptLevel: string | null; tipText: string } {
  const match = tip.match(/^\[Prompt:\s*([^\]]+)\]\s*(.*)/s);
  if (match) return { promptLevel: match[1].trim(), tipText: match[2].trim() };
  return { promptLevel: null, tipText: tip };
}

function PromptBadge({ level }: { level: string }) {
  const color = PROMPT_LEVEL_COLORS[level] ?? "#6B7280";
  return (
    <View style={[badge.pill, { backgroundColor: color + "22", borderColor: color }]}>
      <View style={[badge.dot, { backgroundColor: color }]} />
      <Text style={[badge.text, { color }]}>{level}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, borderWidth: 1, alignSelf: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: "700" },
});

interface Step {
  id: number;
  instruction: string;
  tip?: string;
  order: number;
  mediaUrl?: string;
}

interface VoyageAdventure {
  id: number;
  title: string;
  description?: string;
  coinsPerStep: number;
  completionBonus: number;
  steps: Step[];
}

interface VoyageReward {
  id: number;
  name: string;
  description?: string;
  cost: number;
}

interface VoyagePath {
  id: number;
  learnerId: number;
  title: string;
  description?: string;
  status: "draft" | "active" | "completed";
  frequency: string;
  startDate?: string;
  endDate?: string;
  adventures: VoyageAdventure[];
  rewards: VoyageReward[];
  iepData?: any;
}

export default function VoyagePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { learners } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [voyage, setVoyage] = useState<VoyagePath | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAdventure, setExpandedAdventure] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase()}/voyage-paths/${id}`);
        if (res.ok) {
          const data = await res.json();
          setVoyage(data);
          if (data.adventures?.length > 0) {
            setExpandedAdventure(data.adventures[0].id);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!voyage) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Plan not found</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const learner = learners.find((l) => l.id === voyage.learnerId);
  const totalCoins = voyage.adventures.reduce((sum, adv) => {
    return sum + adv.steps.length * adv.coinsPerStep + adv.completionBonus;
  }, 0);

  const hasPromptLevels = voyage.adventures.some((adv) =>
    adv.steps.some((s) => s.tip?.startsWith("[Prompt:"))
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            Adventure Plan
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Full preview · {learner?.name ?? "Learner"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.goBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace(`/voyage/${id}`);
          }}
        >
          <Text style={[styles.goBtnText, { color: colors.primaryForeground }]}>Open</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 80 }]}>
        {/* Published banner */}
        <View style={[styles.publishedBanner, { backgroundColor: "#10B981" }]}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <View style={styles.publishedBannerText}>
            <Text style={styles.publishedBannerTitle}>Voyage Path Published</Text>
            <Text style={styles.publishedBannerSub}>
              {voyage.adventures.length} adventure{voyage.adventures.length !== 1 ? "s" : ""} ·{" "}
              {voyage.adventures.reduce((s, a) => s + a.steps.length, 0)} steps · {totalCoins} coins total
            </Text>
          </View>
        </View>

        {/* Mission title */}
        <View style={[styles.missionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.missionLabel, { color: colors.mutedForeground }]}>Explorer's Mission</Text>
          <Text style={[styles.missionTitle, { color: colors.foreground }]}>{voyage.title}</Text>
          {voyage.description ? (
            <Text style={[styles.missionDesc, { color: colors.mutedForeground }]}>{voyage.description}</Text>
          ) : null}
          <View style={styles.missionMeta}>
            <View style={[styles.metaPill, { backgroundColor: colors.secondary }]}>
              <Ionicons name="refresh-outline" size={13} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.primary }]}>{voyage.frequency}</Text>
            </View>
            {voyage.startDate ? (
              <View style={[styles.metaPill, { backgroundColor: colors.secondary }]}>
                <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                <Text style={[styles.metaPillText, { color: colors.primary }]}>{voyage.startDate}</Text>
              </View>
            ) : null}
            <View style={[styles.metaPill, { backgroundColor: "#10B98120" }]}>
              <Ionicons name="star" size={13} color="#10B981" />
              <Text style={[styles.metaPillText, { color: "#10B981" }]}>{totalCoins} coins</Text>
            </View>
          </View>
        </View>

        {/* Prompt legend — only if AI-generated steps exist */}
        {hasPromptLevels && (
          <View style={[styles.legendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.legendHeader}>
              <Ionicons name="hand-left" size={13} color="#8B5CF6" />
              <Text style={[styles.legendTitle, { color: colors.foreground }]}>Prompting Key</Text>
            </View>
            <View style={styles.legendRow}>
              {Object.entries(PROMPT_LEVEL_COLORS).map(([level, color]) => (
                <View key={level} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{level}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Adventures */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          🏝️ Adventures ({voyage.adventures.length})
        </Text>

        {voyage.adventures.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="map-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No adventures added</Text>
          </View>
        )}

        {voyage.adventures.map((adv, advIdx) => {
          const isExpanded = expandedAdventure === adv.id;
          const advTotalCoins = adv.steps.length * adv.coinsPerStep + adv.completionBonus;

          return (
            <View key={adv.id} style={[styles.adventureBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Adventure header — tap to expand/collapse */}
              <TouchableOpacity
                style={styles.adventureHeader}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExpandedAdventure(isExpanded ? null : adv.id);
                }}
              >
                <View style={[styles.adventureNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.adventureNumText}>{advIdx + 1}</Text>
                </View>
                <View style={styles.adventureHeaderContent}>
                  <Text style={[styles.adventureTitle, { color: colors.foreground }]}>{adv.title}</Text>
                  <View style={styles.adventureHeaderMeta}>
                    <Text style={[styles.adventureMetaText, { color: colors.mutedForeground }]}>
                      {adv.steps.length} steps
                    </Text>
                    <Text style={[styles.adventureMetaText, { color: colors.coin }]}>
                      {advTotalCoins} 🪙
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>

              {/* Expanded steps */}
              {isExpanded && (
                <View style={[styles.stepsContainer, { borderTopColor: colors.border }]}>
                  {adv.description ? (
                    <Text style={[styles.adventureDesc, { color: colors.mutedForeground }]}>
                      {adv.description}
                    </Text>
                  ) : null}

                  <View style={styles.coinsRow}>
                    <View style={[styles.coinPill, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="star-outline" size={12} color={colors.primary} />
                      <Text style={[styles.coinPillText, { color: colors.primary }]}>
                        {adv.coinsPerStep} coins per step
                      </Text>
                    </View>
                    <View style={[styles.coinPill, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="trophy-outline" size={12} color={colors.primary} />
                      <Text style={[styles.coinPillText, { color: colors.primary }]}>
                        +{adv.completionBonus} bonus
                      </Text>
                    </View>
                  </View>

                  {adv.steps.map((step, stepIdx) => {
                    const parsed = step.tip ? parsePromptLevel(step.tip) : { promptLevel: null, tipText: "" };
                    return (
                      <View
                        key={step.id}
                        style={[styles.stepRow, stepIdx < adv.steps.length - 1 && styles.stepRowBorder, { borderBottomColor: colors.border }]}
                      >
                        <View style={[styles.stepBullet, { backgroundColor: colors.primary }]}>
                          <Text style={styles.stepBulletText}>{stepIdx + 1}</Text>
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={[styles.stepInstruction, { color: colors.foreground }]}>
                            {step.instruction}
                          </Text>
                          {parsed.promptLevel && <PromptBadge level={parsed.promptLevel} />}
                          {parsed.tipText ? (
                            <View style={[styles.stepTip, { backgroundColor: colors.secondary }]}>
                              <Ionicons name="information-circle" size={13} color={colors.primary} />
                              <Text style={[styles.stepTipText, { color: colors.primary }]}>
                                {parsed.tipText}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={[styles.stepCoin, { backgroundColor: colors.coinBg ?? "#FEF9C3" }]}>
                          <Text style={[styles.stepCoinText, { color: colors.coin }]}>
                            +{adv.coinsPerStep}
                          </Text>
                        </View>
                      </View>
                    );
                  })}

                  {/* Completion bonus row */}
                  <View style={[styles.bonusRow, { backgroundColor: "#10B98115", borderColor: "#10B98130" }]}>
                    <Ionicons name="trophy" size={15} color="#10B981" />
                    <Text style={[styles.bonusText, { color: "#10B981" }]}>
                      Completion bonus: +{adv.completionBonus} coins
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Rewards */}
        {voyage.rewards.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
              🎁 Rewards ({voyage.rewards.length})
            </Text>
            {voyage.rewards.map((r) => (
              <View key={r.id} style={[styles.rewardCard, { backgroundColor: colors.card }]}>
                <View style={[styles.rewardIcon, { backgroundColor: colors.coin + "22" }]}>
                  <Ionicons name="gift" size={20} color={colors.coin} />
                </View>
                <View style={styles.rewardContent}>
                  <Text style={[styles.rewardName, { color: colors.foreground }]}>{r.name}</Text>
                  {r.description ? (
                    <Text style={[styles.rewardDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {r.description}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.rewardCost, { backgroundColor: colors.coin + "22" }]}>
                  <Text style={[styles.rewardCostText, { color: colors.coin }]}>{r.cost} 🪙</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomInset + 8 }]}>
        <TouchableOpacity
          style={[styles.openBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.replace(`/voyage/${id}`);
          }}
        >
          <Ionicons name="rocket-outline" size={20} color={colors.primaryForeground} />
          <Text style={[styles.openBtnText, { color: colors.primaryForeground }]}>
            Go to Voyage Path
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFound: { fontSize: 15 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBack: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  goBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  goBtnText: { fontSize: 13, fontWeight: "700" },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  publishedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  publishedBannerText: { flex: 1 },
  publishedBannerTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
  publishedBannerSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  missionCard: { borderRadius: 14, padding: 16, gap: 6 },
  missionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  missionTitle: { fontSize: 20, fontWeight: "800", lineHeight: 26 },
  missionDesc: { fontSize: 14, lineHeight: 20 },
  missionMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  metaPillText: { fontSize: 12, fontWeight: "600" },
  legendCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  legendHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendTitle: { fontSize: 12, fontWeight: "700" },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14 },
  adventureBlock: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  adventureHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  adventureNum: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  adventureNumText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  adventureHeaderContent: { flex: 1 },
  adventureTitle: { fontSize: 15, fontWeight: "700" },
  adventureHeaderMeta: { flexDirection: "row", gap: 10, marginTop: 2 },
  adventureMetaText: { fontSize: 12 },
  adventureDesc: { fontSize: 13, lineHeight: 18, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 8 },
  stepsContainer: { borderTopWidth: 1, paddingBottom: 4 },
  coinsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  coinPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  coinPillText: { fontSize: 11, fontWeight: "600" },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  stepRowBorder: { borderBottomWidth: 1 },
  stepBullet: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepBulletText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  stepContent: { flex: 1, gap: 6 },
  stepInstruction: { fontSize: 14, lineHeight: 20 },
  stepTip: { flexDirection: "row", alignItems: "flex-start", gap: 5, padding: 7, borderRadius: 8 },
  stepTipText: { fontSize: 12, flex: 1, lineHeight: 17 },
  stepCoin: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start", marginTop: 2 },
  stepCoinText: { fontSize: 11, fontWeight: "700" },
  bonusRow: { flexDirection: "row", alignItems: "center", gap: 8, margin: 10, padding: 10, borderRadius: 10, borderWidth: 1 },
  bonusText: { fontSize: 13, fontWeight: "600" },
  rewardCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 12 },
  rewardIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rewardContent: { flex: 1 },
  rewardName: { fontSize: 14, fontWeight: "600" },
  rewardDesc: { fontSize: 12, marginTop: 2 },
  rewardCost: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  rewardCostText: { fontSize: 13, fontWeight: "700" },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  openBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15, borderRadius: 14 },
  openBtnText: { fontSize: 16, fontWeight: "700" },
});
