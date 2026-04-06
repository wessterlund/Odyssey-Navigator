import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { apiBase, useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

interface VoyageAdventure {
  id: number;
  title: string;
  description?: string;
  steps: { id: number; instruction: string; mediaUrl?: string; mediaType?: string }[];
}

interface VoyageReward {
  id: number;
  name: string;
  description?: string;
  cost: number;
}

interface VoyageLog {
  id: number;
  adventureId?: number;
  completionStatus: "in_progress" | "completed" | "skipped";
  mediaUrl?: string;
  mediaType?: string;
  notes?: string;
  createdAt: string;
}

interface IEPGoal {
  id: string;
  domain: string;
  shortTitle: string;
  behavior: string;
  condition: string;
  criterion: string;
  interventions: string[];
  dataCollection: string;
  generalization: string[];
}

interface IEPData {
  missionTitle: string;
  missionDescription: string;
  priorityMap: { tier1: string[]; tier2: string[]; tier3: string[] };
  goals: IEPGoal[];
  behaviorPlan?: {
    targetBehavior: string;
    antecedents: string[];
    functions: string[];
    replacementBehaviors: string[];
    preventionStrategies: string[];
    reinforcementStrategies: string[];
  };
  atRecommendations?: { tool: string; purpose: string; implementation: string }[];
  generatedAt: string;
}

interface VoyagePath {
  id: number;
  learnerId: number;
  learnerName?: string;
  title: string;
  description?: string;
  status: "draft" | "active" | "completed";
  frequency: string;
  visibility: string;
  commentsEnabled: boolean;
  startDate?: string;
  endDate?: string;
  adventures: VoyageAdventure[];
  rewards: VoyageReward[];
  logs: VoyageLog[];
  iepData?: IEPData;
  createdAt: string;
}

export default function VoyagePathScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { learners } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [voyage, setVoyage] = useState<VoyagePath | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [analysisModal, setAnalysisModal] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    recommendation: "ready" | "not_ready";
    confidence: number;
    reasoning: string;
    goalObservations: { goal: string; status: "met" | "emerging" | "not_met"; note: string }[];
    remainingSteps: string[];
  } | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase()}/voyage-paths/${id}`);
      if (res.ok) setVoyage(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const onRefresh = () => { setRefreshing(true); fetch_(); };

  const changeStatus = async (newStatus: "active" | "completed") => {
    setActionLoading(true);
    try {
      await fetch(`${apiBase()}/voyage-paths/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetch_();
    } finally {
      setActionLoading(false);
    }
  };

  const openCompletionAnalysis = async () => {
    if (!voyage) return;
    setAnalysis(null);
    setAnalysisModal(true);
    setAnalysisLoading(true);
    try {
      const res = await fetch(`${apiBase()}/ai/voyage-completion-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: voyage.learnerId,
          title: voyage.title,
          description: voyage.description,
          adventures: voyage.adventures,
          logs: voyage.logs,
          iepData: voyage.iepData,
        }),
      });
      if (res.ok) setAnalysis(await res.json());
    } catch {}
    setAnalysisLoading(false);
  };

  const getLogForAdventure = (adventureId: number) => {
    return voyage?.logs.filter((l) => l.adventureId === adventureId) ?? [];
  };

  const getAdventureStatus = (adventureId: number): "completed" | "in_progress" | "none" => {
    const logs = getLogForAdventure(adventureId);
    if (logs.some((l) => l.completionStatus === "completed")) return "completed";
    if (logs.length > 0) return "in_progress";
    return "none";
  };

  const statusColor = {
    draft: colors.mutedForeground,
    active: "#10B981",
    completed: colors.coin,
  };
  const statusLabel = {
    draft: "Draft",
    active: "Active",
    completed: "Completed",
  };

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
        <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
          Voyage path not found
        </Text>
        <TouchableOpacity style={[styles.backBtn2, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completedCount = voyage.adventures.filter(
    (a) => getAdventureStatus(a.id) === "completed"
  ).length;
  const progressPct =
    voyage.adventures.length > 0
      ? Math.round((completedCount / voyage.adventures.length) * 100)
      : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header banner */}
        <View style={[styles.banner, { backgroundColor: colors.primary, paddingTop: topInset + 8 }]}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={() => router.push(`/voyage/edit/${id}`)}
          >
            <Ionicons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={[styles.statusBadge, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor[voyage.status] }]} />
            <Text style={styles.statusText}>{statusLabel[voyage.status]}</Text>
          </View>

          {(() => {
            const learner = learners.find((l) => l.id === voyage.learnerId);
            if (learner) {
              return (
                <Text style={styles.bannerLearner}>
                  {learner.name.split(" ")[0]}'s Voyage Path
                </Text>
              );
            }
            return null;
          })()}
          <Text style={styles.bannerTitle}>{voyage.title}</Text>

          <View style={styles.bannerMeta}>
            <View style={styles.bannerMetaItem}>
              <Ionicons name="map-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.bannerMetaText}>{voyage.adventures.length} adventures</Text>
            </View>
            <View style={styles.bannerMetaItem}>
              <Ionicons name="refresh-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={[styles.bannerMetaText, { textTransform: "capitalize" }]}>{voyage.frequency}</Text>
            </View>
            {voyage.startDate && (
              <View style={styles.bannerMetaItem}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.bannerMetaText}>{voyage.startDate}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Explorer's Mission */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="compass" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Explorer's Mission</Text>
            </View>
            {voyage.description ? (
              <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{voyage.description}</Text>
            ) : (
              <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>No mission description provided.</Text>
            )}
          </View>

          {/* IEP Plan */}
          {voyage.iepData && (
            <IEPSection iepData={voyage.iepData} colors={colors} />
          )}

          {/* Progress */}
          {voyage.status === "active" && voyage.adventures.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.progressRow}>
                <Text style={[styles.progressLabel, { color: colors.foreground }]}>
                  {completedCount} / {voyage.adventures.length} completed
                </Text>
                <Text style={[styles.progressPct, { color: colors.primary }]}>{progressPct}%</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progressPct}%` }]}
                />
              </View>
            </View>
          )}

          {/* Treasure Islands (Adventures) */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                🏝️ Treasure Islands
              </Text>
              {voyage.status !== "completed" && (
                <TouchableOpacity
                  style={[styles.addTaskBtn, { backgroundColor: colors.primary + "18" }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/voyage/${id}/add-adventure`);
                  }}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={[styles.addTaskBtnText, { color: colors.primary }]}>Add task</Text>
                </TouchableOpacity>
              )}
            </View>
            {voyage.adventures.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="map-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No adventures added yet
                </Text>
              </View>
            ) : (
              voyage.adventures.map((adv, i) => {
                const status = getAdventureStatus(adv.id);
                const logs = getLogForAdventure(adv.id);
                return (
                  <TouchableOpacity
                    key={adv.id}
                    style={[styles.adventureCard, { backgroundColor: colors.card }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/voyage/execute/${adv.id}?voyageId=${id}`);
                    }}
                  >
                    <View
                      style={[
                        styles.adventureIndex,
                        {
                          backgroundColor:
                            status === "completed"
                              ? "#10B981"
                              : status === "in_progress"
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                    >
                      {status === "completed" ? (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      ) : (
                        <Text style={styles.adventureIndexText}>{i + 1}</Text>
                      )}
                    </View>
                    <View style={styles.adventureCardContent}>
                      <Text style={[styles.adventureTitle, { color: colors.foreground }]}>{adv.title}</Text>
                      {adv.description && (
                        <Text style={[styles.adventureDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {adv.description}
                        </Text>
                      )}
                      <View style={styles.adventureMeta}>
                        <Text style={[styles.adventureMetaText, { color: colors.mutedForeground }]}>
                          {adv.steps.length} steps
                        </Text>
                        {logs.length > 0 && (
                          <View style={[styles.logBadge, { backgroundColor: `${colors.primary}18` }]}>
                            <Ionicons name="time-outline" size={11} color={colors.primary} />
                            <Text style={[styles.logBadgeText, { color: colors.primary }]}>
                              {logs.length} log{logs.length !== 1 ? "s" : ""}
                            </Text>
                          </View>
                        )}
                      </View>
                      {status === "completed" && (
                        <TouchableOpacity
                          style={[styles.editMediaBtn, { backgroundColor: `${colors.primary}15` }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push(`/adventure/${adv.id}?editMedia=true`);
                          }}
                        >
                          <Ionicons name="camera-outline" size={12} color={colors.primary} />
                          <Text style={[styles.editMediaBtnText, { color: colors.primary }]}>Edit Media & Thumbnail</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Rewards */}
          {voyage.rewards.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🎁 Rewards</Text>
              {voyage.rewards.map((r) => (
                <View key={r.id} style={[styles.rewardCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.rewardIcon, { backgroundColor: `${colors.coin}22` }]}>
                    <Ionicons name="gift" size={22} color={colors.coin} />
                  </View>
                  <View style={styles.rewardContent}>
                    <Text style={[styles.rewardName, { color: colors.foreground }]}>{r.name}</Text>
                    {r.description && (
                      <Text style={[styles.rewardDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {r.description}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.coinBadge, { backgroundColor: `${colors.coin}22` }]}>
                    <Text style={[styles.coinText, { color: colors.coin }]}>{r.cost} 🪙</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Recent Logs */}
          {voyage.logs.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📋 Recent Logs</Text>
              {voyage.logs.slice(0, 5).map((log) => {
                const adv = voyage.adventures.find((a) => a.id === log.adventureId);
                return (
                  <View key={log.id} style={[styles.logCard, { backgroundColor: colors.card }]}>
                    <View
                      style={[
                        styles.logStatusDot,
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
                    <View style={styles.logContent}>
                      <Text style={[styles.logAdv, { color: colors.foreground }]}>
                        {adv?.title ?? "Unknown adventure"}
                      </Text>
                      <Text style={[styles.logTime, { color: colors.mutedForeground }]}>
                        {new Date(log.createdAt).toLocaleDateString()} ·{" "}
                        <Text style={{ textTransform: "capitalize" }}>{log.completionStatus.replace("_", " ")}</Text>
                      </Text>
                      {log.notes && (
                        <Text style={[styles.logNotes, { color: colors.mutedForeground }]}>
                          {log.notes}
                        </Text>
                      )}
                    </View>
                    {log.mediaUrl && (
                      <Ionicons name="videocam" size={18} color={colors.primary} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      {voyage.status !== "completed" && (
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomInset + 8 },
          ]}
        >
          {voyage.status === "draft" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              disabled={actionLoading}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                changeStatus("active");
              }}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={20} color={colors.primaryForeground} />
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                    Start Voyage Path
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {voyage.status === "active" && (
            <View style={styles.activeActionRow}>
              <TouchableOpacity
                style={[styles.actionBtnOutline, { borderColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const learner = learners.find((l) => l.id === voyage.learnerId);
                  if (learner) router.push(`/profile/${learner.id}/progress`);
                }}
              >
                <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionBtnOutlineText, { color: colors.primary }]}>
                  Show Progress
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtnFill, { backgroundColor: "#10B981" }]}
                disabled={actionLoading}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  openCompletionAnalysis();
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={[styles.actionBtnFillText, { color: "#fff" }]}>
                      Complete Voyage Path
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* AI Completion Analysis Modal */}
      <Modal visible={analysisModal} transparent animationType="slide" onRequestClose={() => setAnalysisModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
            <View style={modalStyles.header}>
              <View style={[modalStyles.headerIcon, { backgroundColor: "#8B5CF620" }]}>
                <Ionicons name="sparkles" size={20} color="#8B5CF6" />
              </View>
              <Text style={[modalStyles.headerTitle, { color: colors.foreground }]}>
                Completion Analysis
              </Text>
              <TouchableOpacity onPress={() => setAnalysisModal(false)} style={modalStyles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {analysisLoading ? (
              <View style={modalStyles.loadingState}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={[modalStyles.loadingText, { color: colors.mutedForeground }]}>
                  Analyzing voyage path with BCBA framework…
                </Text>
              </View>
            ) : analysis ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.body}>
                {/* Recommendation pill */}
                <View style={[modalStyles.recPill, {
                  backgroundColor: analysis.recommendation === "ready" ? "#10B98118" : "#F5950018",
                  borderColor: analysis.recommendation === "ready" ? "#10B981" : "#F59500",
                }]}>
                  <Ionicons
                    name={analysis.recommendation === "ready" ? "checkmark-circle" : "time-outline"}
                    size={18}
                    color={analysis.recommendation === "ready" ? "#10B981" : "#F59500"}
                  />
                  <Text style={[modalStyles.recText, {
                    color: analysis.recommendation === "ready" ? "#10B981" : "#F59500",
                  }]}>
                    {analysis.recommendation === "ready" ? "Ready to Complete" : "Not Ready Yet"}{" "}
                    <Text style={modalStyles.confidenceText}>({analysis.confidence}% confidence)</Text>
                  </Text>
                </View>

                {/* Reasoning */}
                <View style={[modalStyles.reasoningBlock, { backgroundColor: colors.card }]}>
                  <Text style={[modalStyles.reasoningLabel, { color: colors.mutedForeground }]}>Clinical Assessment</Text>
                  <Text style={[modalStyles.reasoningText, { color: colors.foreground }]}>{analysis.reasoning}</Text>
                </View>

                {/* Goal observations */}
                {analysis.goalObservations.length > 0 && (
                  <View style={modalStyles.observationsBlock}>
                    <Text style={[modalStyles.obsLabel, { color: colors.mutedForeground }]}>Goal Observations</Text>
                    {analysis.goalObservations.map((obs, i) => (
                      <View key={i} style={[modalStyles.obsRow, { backgroundColor: colors.card }]}>
                        <View style={[modalStyles.obsDot, {
                          backgroundColor: obs.status === "met" ? "#10B981" : obs.status === "emerging" ? "#F59E0B" : "#EF4444"
                        }]} />
                        <View style={modalStyles.obsContent}>
                          <Text style={[modalStyles.obsGoal, { color: colors.foreground }]}>{obs.goal}</Text>
                          <Text style={[modalStyles.obsNote, { color: colors.mutedForeground }]}>{obs.note}</Text>
                        </View>
                        <View style={[modalStyles.obsStatusPill, {
                          backgroundColor: obs.status === "met" ? "#10B98118" : obs.status === "emerging" ? "#F59E0B18" : "#EF444418"
                        }]}>
                          <Text style={[modalStyles.obsStatusText, {
                            color: obs.status === "met" ? "#10B981" : obs.status === "emerging" ? "#F59E0B" : "#EF4444"
                          }]}>{obs.status}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Remaining steps */}
                {analysis.remainingSteps?.length > 0 && (
                  <View style={[modalStyles.remainingBlock, { backgroundColor: "#F59E0B10", borderColor: "#F59E0B30" }]}>
                    <Text style={[modalStyles.remainingLabel, { color: "#F59E0B" }]}>Still Needed</Text>
                    {analysis.remainingSteps.map((step, i) => (
                      <View key={i} style={modalStyles.remainingRow}>
                        <Ionicons name="arrow-forward-circle" size={14} color="#F59E0B" />
                        <Text style={[modalStyles.remainingText, { color: colors.foreground }]}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action buttons */}
                <View style={modalStyles.actionRow}>
                  {analysis.recommendation === "not_ready" ? (
                    <>
                      <TouchableOpacity
                        style={[modalStyles.modalBtnOutline, { borderColor: "#EF4444" }]}
                        onPress={() => { setAnalysisModal(false); changeStatus("completed"); }}
                      >
                        <Text style={[modalStyles.modalBtnOutlineText, { color: "#EF4444" }]}>
                          Complete Anyway
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[modalStyles.modalBtnFill, { backgroundColor: colors.primary }]}
                        onPress={() => setAnalysisModal(false)}
                      >
                        <Ionicons name="arrow-forward" size={16} color={colors.primaryForeground} />
                        <Text style={[modalStyles.modalBtnFillText, { color: colors.primaryForeground }]}>
                          Keep Going
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[modalStyles.modalBtnOutline, { borderColor: colors.border }]}
                        onPress={() => setAnalysisModal(false)}
                      >
                        <Text style={[modalStyles.modalBtnOutlineText, { color: colors.mutedForeground }]}>
                          Keep Going
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[modalStyles.modalBtnFill, { backgroundColor: "#10B981" }]}
                        onPress={() => { setAnalysisModal(false); changeStatus("completed"); }}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={[modalStyles.modalBtnFillText, { color: "#fff" }]}>
                          Complete Voyage Path
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </ScrollView>
            ) : (
              <View style={modalStyles.loadingState}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.mutedForeground} />
                <Text style={[modalStyles.loadingText, { color: colors.mutedForeground }]}>
                  Analysis unavailable. You can still complete manually.
                </Text>
                <TouchableOpacity
                  style={[modalStyles.modalBtnFill, { backgroundColor: "#10B981", marginTop: 8 }]}
                  onPress={() => { setAnalysisModal(false); changeStatus("completed"); }}
                >
                  <Text style={[modalStyles.modalBtnFillText, { color: "#fff" }]}>Complete Anyway</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const DOMAIN_ICONS: Record<string, string> = {
  communication: "chatbubble-ellipses-outline",
  behavior: "warning-outline",
  social: "people-outline",
  adl: "home-outline",
  academic: "book-outline",
  motor: "body-outline",
};

const DOMAIN_COLORS: Record<string, string> = {
  communication: "#2F80ED",
  behavior: "#EF4444",
  social: "#8B5CF6",
  adl: "#10B981",
  academic: "#F59E0B",
  motor: "#06B6D4",
};

function IEPSection({ iepData, colors }: { iepData: IEPData; colors: any }) {
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [showBP, setShowBP] = useState(false);
  const [showAT, setShowAT] = useState(false);

  return (
    <View>
      {/* IEP Header */}
      <View style={[iepStyles.iepHeader, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}25` }]}>
        <View style={iepStyles.iepHeaderTop}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={[iepStyles.iepHeaderTitle, { color: colors.primary }]}>AI IEP Plan</Text>
          <View style={[iepStyles.iepBadge, { backgroundColor: colors.primary }]}>
            <Text style={iepStyles.iepBadgeText}>{iepData.goals.length} goals</Text>
          </View>
        </View>
        <Text style={[iepStyles.iepGenDate, { color: colors.mutedForeground }]}>
          Generated {new Date(iepData.generatedAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Priority Map */}
      <View style={iepStyles.sectionBlock}>
        <Text style={[iepStyles.blockLabel, { color: colors.mutedForeground }]}>Priority Map</Text>
        {[
          { key: "tier1", label: "Tier 1 — Immediate Priority", color: "#EF4444", bg: "#FEF2F2" },
          { key: "tier2", label: "Tier 2 — Important", color: "#F59E0B", bg: "#FFFBEB" },
          { key: "tier3", label: "Tier 3 — Generalization", color: "#10B981", bg: "#F0FDF4" },
        ].map(({ key, label, color, bg }) => {
          const items = (iepData.priorityMap as any)[key] as string[];
          if (!items?.length) return null;
          return (
            <View key={key} style={[iepStyles.tierCard, { backgroundColor: bg, borderLeftColor: color }]}>
              <Text style={[iepStyles.tierLabel, { color }]}>{label}</Text>
              {items.map((item, i) => (
                <View key={i} style={iepStyles.tierItemRow}>
                  <View style={[iepStyles.tierDot, { backgroundColor: color }]} />
                  <Text style={[iepStyles.tierItemText, { color: colors.foreground }]}>{item}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {/* IEP Goals */}
      <View style={iepStyles.sectionBlock}>
        <Text style={[iepStyles.blockLabel, { color: colors.mutedForeground }]}>IEP Goals</Text>
        {iepData.goals.map((goal) => {
          const domColor = DOMAIN_COLORS[goal.domain] ?? colors.primary;
          const domIcon = DOMAIN_ICONS[goal.domain] ?? "flag-outline";
          const expanded = expandedGoal === goal.id;
          return (
            <View key={goal.id} style={[iepStyles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={iepStyles.goalHeader}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExpandedGoal(expanded ? null : goal.id);
                }}
              >
                <View style={[iepStyles.domainBadge, { backgroundColor: `${domColor}18` }]}>
                  <Ionicons name={domIcon as any} size={13} color={domColor} />
                  <Text style={[iepStyles.domainText, { color: domColor }]}>{goal.domain}</Text>
                </View>
                <Text style={[iepStyles.goalTitle, { color: colors.foreground, flex: 1, marginLeft: 8 }]}>
                  {goal.shortTitle}
                </Text>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>

              {expanded && (
                <View style={[iepStyles.goalBody, { borderTopColor: colors.border }]}>
                  <IEPField label="Behavior" value={goal.behavior} colors={colors} />
                  <IEPField label="Condition" value={goal.condition} colors={colors} />
                  <IEPField label="Mastery Criterion" value={goal.criterion} colors={colors} accent={domColor} />
                  <IEPField label="Data Collection" value={goal.dataCollection} colors={colors} />

                  {goal.interventions.length > 0 && (
                    <View style={iepStyles.fieldBlock}>
                      <Text style={[iepStyles.fieldLabel, { color: colors.mutedForeground }]}>Evidence-Based Interventions</Text>
                      {goal.interventions.map((iv, i) => (
                        <View key={i} style={iepStyles.bulletRow}>
                          <View style={[iepStyles.bullet, { backgroundColor: domColor }]} />
                          <Text style={[iepStyles.bulletText, { color: colors.foreground }]}>{iv}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {goal.generalization.length > 0 && (
                    <View style={iepStyles.fieldBlock}>
                      <Text style={[iepStyles.fieldLabel, { color: colors.mutedForeground }]}>Generalization Targets</Text>
                      {goal.generalization.map((g, i) => (
                        <View key={i} style={iepStyles.bulletRow}>
                          <Ionicons name="arrow-forward-outline" size={12} color={colors.mutedForeground} />
                          <Text style={[iepStyles.bulletText, { color: colors.foreground }]}>{g}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Behavior Plan */}
      {iepData.behaviorPlan && (
        <View style={iepStyles.sectionBlock}>
          <TouchableOpacity
            style={[iepStyles.collapsibleHeader, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}
            onPress={() => setShowBP((v) => !v)}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color="#EF4444" />
            <Text style={[iepStyles.collapsibleTitle, { color: "#DC2626", flex: 1 }]}>Behavior Intervention Plan</Text>
            <Ionicons name={showBP ? "chevron-up" : "chevron-down"} size={16} color="#EF4444" />
          </TouchableOpacity>
          {showBP && (
            <View style={[iepStyles.collapsibleBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IEPField label="Target Behavior" value={iepData.behaviorPlan.targetBehavior} colors={colors} />
              <BPList label="Antecedents / Triggers" items={iepData.behaviorPlan.antecedents} colors={colors} dotColor="#EF4444" />
              <BPList label="Behavior Functions" items={iepData.behaviorPlan.functions} colors={colors} dotColor="#F59E0B" capitalize />
              <BPList label="Replacement Behaviors" items={iepData.behaviorPlan.replacementBehaviors} colors={colors} dotColor="#10B981" />
              <BPList label="Prevention Strategies" items={iepData.behaviorPlan.preventionStrategies} colors={colors} dotColor="#2F80ED" />
              <BPList label="Reinforcement Strategies" items={iepData.behaviorPlan.reinforcementStrategies} colors={colors} dotColor="#8B5CF6" />
            </View>
          )}
        </View>
      )}

      {/* AT Recommendations */}
      {iepData.atRecommendations && iepData.atRecommendations.length > 0 && (
        <View style={iepStyles.sectionBlock}>
          <TouchableOpacity
            style={[iepStyles.collapsibleHeader, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}
            onPress={() => setShowAT((v) => !v)}
          >
            <Ionicons name="hardware-chip-outline" size={16} color="#10B981" />
            <Text style={[iepStyles.collapsibleTitle, { color: "#059669", flex: 1 }]}>
              Assistive Technology ({iepData.atRecommendations.length})
            </Text>
            <Ionicons name={showAT ? "chevron-up" : "chevron-down"} size={16} color="#10B981" />
          </TouchableOpacity>
          {showAT && (
            <View style={[iepStyles.collapsibleBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {iepData.atRecommendations.map((at, i) => (
                <View key={i} style={[iepStyles.atCard, { borderColor: colors.border }]}>
                  <Text style={[iepStyles.atTool, { color: colors.foreground }]}>{at.tool}</Text>
                  <Text style={[iepStyles.atPurpose, { color: colors.mutedForeground }]}>{at.purpose}</Text>
                  <Text style={[iepStyles.atImpl, { color: colors.foreground }]}>{at.implementation}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function IEPField({ label, value, colors, accent }: { label: string; value: string; colors: any; accent?: string }) {
  return (
    <View style={iepStyles.fieldBlock}>
      <Text style={[iepStyles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[iepStyles.fieldValue, { color: accent ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

function BPList({ label, items, colors, dotColor, capitalize }: { label: string; items: string[]; colors: any; dotColor: string; capitalize?: boolean }) {
  return (
    <View style={iepStyles.fieldBlock}>
      <Text style={[iepStyles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {items.map((item, i) => (
        <View key={i} style={iepStyles.bulletRow}>
          <View style={[iepStyles.bullet, { backgroundColor: dotColor }]} />
          <Text style={[iepStyles.bulletText, { color: colors.foreground, textTransform: capitalize ? "capitalize" : "none" }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

const iepStyles = StyleSheet.create({
  iepHeader: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 4,
  },
  iepHeaderTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  iepHeaderTitle: { fontSize: 16, fontWeight: "800", flex: 1 },
  iepBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  iepBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  iepGenDate: { fontSize: 12 },
  sectionBlock: { marginBottom: 12, gap: 8 },
  blockLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 },
  tierCard: {
    borderLeftWidth: 3,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 10,
    gap: 4,
  },
  tierLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 },
  tierItemRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tierDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  tierItemText: { fontSize: 14, lineHeight: 20, flex: 1 },
  goalCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  goalHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 6 },
  domainBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  domainText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  goalTitle: { fontSize: 14, fontWeight: "700" },
  goalBody: { borderTopWidth: 1, padding: 14, gap: 12 },
  fieldBlock: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  fieldValue: { fontSize: 14, lineHeight: 20 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { fontSize: 14, lineHeight: 20, flex: 1 },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  collapsibleTitle: { fontSize: 14, fontWeight: "700" },
  collapsibleBody: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    marginTop: 4,
  },
  atCard: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    gap: 4,
  },
  atTool: { fontSize: 15, fontWeight: "700" },
  atPurpose: { fontSize: 13, lineHeight: 18 },
  atImpl: { fontSize: 13, lineHeight: 18 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  notFoundText: { fontSize: 16, textAlign: "center" },
  backBtn2: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  banner: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 8,
    position: "relative",
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headerEditBtn: {
    position: "absolute",
    right: 16,
    top: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  bannerLearner: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "600" },
  bannerTitle: { color: "#fff", fontSize: 26, fontWeight: "800", lineHeight: 32 },
  bannerMeta: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  bannerMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  bannerMetaText: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  content: { padding: 20, gap: 16 },
  card: { borderRadius: 16, padding: 16, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardDesc: { fontSize: 14, lineHeight: 21 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 14, fontWeight: "600" },
  progressPct: { fontSize: 14, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6 },
  section: { gap: 10 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  addTaskBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addTaskBtnText: { fontSize: 13, fontWeight: "700" },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyText: { fontSize: 14 },
  adventureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  adventureIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  adventureIndexText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  adventureCardContent: { flex: 1, gap: 3 },
  adventureTitle: { fontSize: 15, fontWeight: "700" },
  adventureDesc: { fontSize: 13 },
  adventureMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  adventureMetaText: { fontSize: 12 },
  logBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  logBadgeText: { fontSize: 11, fontWeight: "600" },
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  rewardIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  rewardContent: { flex: 1, gap: 3 },
  rewardName: { fontSize: 15, fontWeight: "700" },
  rewardDesc: { fontSize: 13 },
  coinBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  coinText: { fontSize: 13, fontWeight: "700" },
  logCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    padding: 12,
  },
  logStatusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  logContent: { flex: 1, gap: 2 },
  logAdv: { fontSize: 14, fontWeight: "600" },
  logTime: { fontSize: 12 },
  logNotes: { fontSize: 12, fontStyle: "italic", marginTop: 2 },
  bottomBar: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  actionBtnText: { fontSize: 16, fontWeight: "700" },
  activeActionRow: { flexDirection: "row", gap: 10 },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionBtnOutlineText: { fontSize: 14, fontWeight: "700" },
  actionBtnFill: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnFillText: { fontSize: 14, fontWeight: "700" },
  editMediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  editMediaBtnText: { fontSize: 11, fontWeight: "700" },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 18, paddingBottom: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700" },
  closeBtn: { padding: 4 },
  loadingState: { padding: 32, alignItems: "center", gap: 14 },
  loadingText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  body: { paddingHorizontal: 18, paddingBottom: 32, gap: 12 },
  recPill: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  recText: { fontSize: 15, fontWeight: "700" },
  confidenceText: { fontSize: 12, fontWeight: "500" },
  reasoningBlock: { borderRadius: 12, padding: 14, gap: 6 },
  reasoningLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  reasoningText: { fontSize: 14, lineHeight: 21 },
  observationsBlock: { gap: 8 },
  obsLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  obsRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 10, borderRadius: 10 },
  obsDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  obsContent: { flex: 1, gap: 2 },
  obsGoal: { fontSize: 13, fontWeight: "600" },
  obsNote: { fontSize: 12, lineHeight: 17 },
  obsStatusPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  obsStatusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  remainingBlock: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  remainingLabel: { fontSize: 12, fontWeight: "700" },
  remainingRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  remainingText: { fontSize: 13, flex: 1, lineHeight: 18 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtnOutline: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  modalBtnOutlineText: { fontSize: 14, fontWeight: "700" },
  modalBtnFill: { flex: 1.4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 14, borderRadius: 14 },
  modalBtnFillText: { fontSize: 14, fontWeight: "700" },
});
