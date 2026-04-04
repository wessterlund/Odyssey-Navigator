import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const SCREEN_W = Dimensions.get("window").width;

interface PerformanceEntry {
  id: number;
  learnerId: number;
  adventureId: number;
  stepId: number;
  completed: boolean;
  attempts: number;
  duration?: number;
  createdAt: string;
}

interface AdventureStat {
  adventureId: number;
  title: string;
  totalSteps: number;
  completedSessions: number;
  totalSessions: number;
  completionRate: number;
  lastSession?: string;
}

interface WeeklyPoint {
  label: string;
  value: number;
}

function MiniBarChart({ data, color }: { data: WeeklyPoint[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={chartStyles.barCol}>
          <View style={chartStyles.barTrack}>
            <View
              style={[
                chartStyles.barFill,
                {
                  backgroundColor: color,
                  height: `${(d.value / max) * 100}%` as any,
                },
              ]}
            />
          </View>
          <Text style={chartStyles.label}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 80,
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: {
    flex: 1,
    width: "70%",
    backgroundColor: "#0001",
    borderRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: { width: "100%", borderRadius: 4 },
  label: { fontSize: 10, color: "#888", fontWeight: "600" },
});

function DonutRing({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 6,
          borderColor: color + "22",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 6,
          borderColor: "transparent",
          borderTopColor: color,
          transform: [{ rotate: `${(pct / 100) * 360 - 90}deg` }],
        }}
      />
      <Text style={{ fontSize: 16, fontWeight: "800", color }}>{pct}%</Text>
    </View>
  );
}

export default function LearnerProgressScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { learners, adventures } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [performance, setPerformance] = useState<PerformanceEntry[]>([]);
  const [adventureStats, setAdventureStats] = useState<AdventureStat[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const learner = learners.find((l) => String(l.id) === id);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${apiBase()}/ai/performance?learnerId=${id}`);
      if (res.ok) {
        const data: PerformanceEntry[] = await res.json();
        setPerformance(data);
        buildStats(data);
      }
    } catch {
      buildStats([]);
    } finally {
      setLoading(false);
    }
  }, [id, adventures]);

  function buildStats(data: PerformanceEntry[]) {
    const statMap: Record<number, { completed: number; total: number; dates: string[] }> = {};
    for (const e of data) {
      if (!statMap[e.adventureId]) statMap[e.adventureId] = { completed: 0, total: 0, dates: [] };
      statMap[e.adventureId].total++;
      if (e.completed) statMap[e.adventureId].completed++;
      statMap[e.adventureId].dates.push(e.createdAt);
    }

    const stats: AdventureStat[] = adventures.map((adv) => {
      const s = statMap[adv.id];
      const rate = s ? Math.round((s.completed / Math.max(s.total, 1)) * 100) : 0;
      const lastD = s?.dates.sort().reverse()[0];
      return {
        adventureId: adv.id,
        title: adv.title,
        totalSteps: adv.steps?.length ?? 0,
        completedSessions: s?.completed ?? 0,
        totalSessions: s?.total ?? 0,
        completionRate: rate,
        lastSession: lastD,
      };
    });
    setAdventureStats(stats);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const weekPoints: WeeklyPoint[] = days.map((label, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const count = data.filter((e) => e.createdAt.startsWith(dateStr) && e.completed).length;
      return { label, value: count };
    });
    setWeeklyData(weekPoints);
  }

  useEffect(() => { loadData(); }, [id, adventures]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const totalCompleted = performance.filter((e) => e.completed).length;
  const totalAttempts = performance.length;
  const overallRate = totalAttempts > 0 ? Math.round((totalCompleted / totalAttempts) * 100) : 0;
  const activeAdventures = adventureStats.filter((s) => s.totalSessions > 0);
  const avgRate = activeAdventures.length > 0
    ? Math.round(activeAdventures.reduce((s, a) => s + a.completionRate, 0) / activeAdventures.length)
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topInset + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Progress & Analytics</Text>
          {learner && (
            <Text style={styles.headerSub}>{learner.name}</Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        {/* Overview Cards */}
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
            <DonutRing pct={overallRate} color={colors.primary} size={72} />
            <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>
              Overall Completion
            </Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
            <DonutRing pct={avgRate} color="#10B981" size={72} />
            <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>
              Avg per Adventure
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statPill, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{totalCompleted}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Steps Done</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.card }]}>
            <Ionicons name="repeat" size={18} color="#F59E0B" />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{totalAttempts}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Attempts</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.card }]}>
            <Ionicons name="map" size={18} color="#8B5CF6" />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{activeAdventures.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active Adventures</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>This Week</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Steps completed per day</Text>
          </View>
          <MiniBarChart data={weeklyData} color={colors.primary} />
        </View>

        {/* Per-Adventure Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Adventure Breakdown</Text>

          {adventureStats.length === 0 && !loading && (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Ionicons name="bar-chart-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No performance data yet. Start completing adventures to see progress here.
              </Text>
            </View>
          )}

          {adventureStats.map((stat) => {
            const pctColor =
              stat.completionRate >= 80
                ? "#10B981"
                : stat.completionRate >= 50
                ? "#F59E0B"
                : "#EF4444";
            return (
              <View key={stat.adventureId} style={[styles.adventureStatCard, { backgroundColor: colors.card }]}>
                <View style={styles.adventureStatTop}>
                  <View style={[styles.adventureIcon, { backgroundColor: colors.primary + "18" }]}>
                    <Ionicons name="map-outline" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.adventureStatInfo}>
                    <Text style={[styles.adventureStatTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {stat.title}
                    </Text>
                    <Text style={[styles.adventureStatMeta, { color: colors.mutedForeground }]}>
                      {stat.totalSessions} sessions · {stat.totalSteps} steps
                    </Text>
                  </View>
                  <Text style={[styles.adventureStatPct, { color: pctColor }]}>
                    {stat.completionRate}%
                  </Text>
                </View>
                {/* Progress bar */}
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: pctColor, width: `${stat.completionRate}%` as any },
                    ]}
                  />
                </View>
                {stat.lastSession && (
                  <Text style={[styles.lastSession, { color: colors.mutedForeground }]}>
                    Last session: {new Date(stat.lastSession).toLocaleDateString()}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  body: { padding: 16, gap: 20 },
  overviewRow: { flexDirection: "row", gap: 12 },
  overviewCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 10 },
  statPill: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statNum: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 10, fontWeight: "500", textAlign: "center" },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  cardHeader: { gap: 2 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSub: { fontSize: 12 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  emptyCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  adventureStatCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  adventureStatTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  adventureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  adventureStatInfo: { flex: 1, gap: 2 },
  adventureStatTitle: { fontSize: 14, fontWeight: "700" },
  adventureStatMeta: { fontSize: 12 },
  adventureStatPct: { fontSize: 20, fontWeight: "800" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  lastSession: { fontSize: 11 },
});
