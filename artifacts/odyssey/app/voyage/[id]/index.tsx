import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
  ActivityIndicator,
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
                    Launch Voyage Path
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {voyage.status === "active" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
              disabled={actionLoading}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                changeStatus("completed");
              }}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                    Complete Voyage Path
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

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
});
