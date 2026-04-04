import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase, Learner } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

interface VoyagePath {
  id: number;
  title: string;
  status: "draft" | "active" | "completed";
  adventureIds: number[];
}

const AVATAR_COLORS = [
  "#2F80ED","#8B5CF6","#EC4899","#F59E0B","#10B981","#EF4444","#06B6D4","#F97316",
];

function getAvatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function calcAge(birthday: string) {
  if (!birthday) return null;
  const today = new Date();
  const bday = new Date(birthday);
  let age = today.getFullYear() - bday.getFullYear();
  const m = today.getMonth() - bday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
  return age;
}

function StudentCard({
  learner,
  voyagePath,
  isActive,
  onSelect,
}: {
  learner: Learner;
  voyagePath: VoyagePath | null;
  isActive: boolean;
  onSelect: () => void;
}) {
  const colors = useColors();
  const router = useRouter();
  const avatarColor = getAvatarColor(learner.id);
  const initials = getInitials(learner.name);
  const age = calcAge(learner.birthday);

  const statusColor = voyagePath
    ? voyagePath.status === "active"
      ? "#10B981"
      : voyagePath.status === "completed"
      ? colors.coin
      : colors.mutedForeground
    : colors.mutedForeground;

  return (
    <View
      style={[
        styles.studentCard,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : colors.border,
          borderWidth: isActive ? 2 : 1,
        },
      ]}
    >
      {/* Top row: avatar + name + active indicator */}
      <TouchableOpacity
        style={styles.cardTopRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect();
          router.push(`/profile/${learner.id}`);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.foreground }]}>{learner.name}</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {age ? `${age} years old` : ""}
            {age && learner.diagnosis ? " · " : ""}
            {learner.diagnosis ?? ""}
          </Text>
          {learner.school && (
            <Text style={[styles.cardSchool, { color: colors.mutedForeground }]} numberOfLines={1}>
              {learner.school}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Three action buttons */}
      <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
        {/* Voyage Path */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSelect();
            if (voyagePath) router.push(`/voyage/${voyagePath.id}`);
            else router.push("/voyage/create");
          }}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: colors.primary + "16" }]}>
            <Ionicons name="compass" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.actionLabel, { color: colors.foreground }]}>
            {voyagePath ? "Voyage Path" : "Create Path"}
          </Text>
          {voyagePath && (
            <View style={[styles.actionStatusDot, { backgroundColor: statusColor }]} />
          )}
        </TouchableOpacity>

        <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

        {/* Progress */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSelect();
            router.push(`/profile/${learner.id}/progress` as any);
          }}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: "#10B98116" }]}>
            <Ionicons name="bar-chart-outline" size={18} color="#10B981" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.foreground }]}>Progress</Text>
        </TouchableOpacity>

        <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

        {/* Profile */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSelect();
            router.push(`/profile/${learner.id}` as any);
          }}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: "#8B5CF616" }]}>
            <Ionicons name="person-outline" size={18} color="#8B5CF6" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.foreground }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function StudentsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { learners, loading, loadLearners, currentLearner, setCurrentLearner, refreshAll } = useApp();
  const [voyageMap, setVoyageMap] = useState<Record<number, VoyagePath | null>>({});
  const [refreshing, setRefreshing] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const loadVoyages = useCallback(async (ids: number[]) => {
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`${apiBase()}/voyage-paths/learner/${id}`);
          if (res.ok) {
            const paths: VoyagePath[] = await res.json();
            const active = paths.find((vp) => vp.status === "active") ?? paths[0] ?? null;
            return [id, active] as const;
          }
        } catch {}
        return [id, null] as const;
      })
    );
    const map: Record<number, VoyagePath | null> = {};
    for (const [id, vp] of entries) map[id] = vp;
    setVoyageMap(map);
  }, []);

  useEffect(() => {
    loadLearners();
  }, []);

  useEffect(() => {
    if (learners.length > 0) loadVoyages(learners.map((l) => l.id));
  }, [learners]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLearners();
    if (learners.length > 0) await loadVoyages(learners.map((l) => l.id));
    setRefreshing(false);
  }, [learners, loadLearners, loadVoyages]);

  const handleSelectLearner = useCallback((learner: Learner) => {
    setCurrentLearner(learner);
    refreshAll(learner.id);
  }, [setCurrentLearner, refreshAll]);

  const activeCount = Object.values(voyageMap).filter((vp) => vp?.status === "active").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Students</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {learners.length} {learners.length === 1 ? "learner" : "learners"} · {activeCount} active paths
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/profile/create");
          }}
        >
          <Ionicons name="person-add-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 90 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick-access legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Ionicons name="compass" size={14} color={colors.primary} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Voyage Path</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="bar-chart-outline" size={14} color="#10B981" />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Progress</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="person-outline" size={14} color="#8B5CF6" />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Profile</Text>
          </View>
        </View>

        {/* Empty state */}
        {learners.length === 0 && !loading && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 48 }}>🧒</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Students Yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Create a learner profile to get started with personalized adventures.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/profile/create")}
            >
              <Text style={[styles.emptyBtnText, { color: "#fff" }]}>Create Learner Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Student cards */}
        {learners.map((learner) => (
          <StudentCard
            key={learner.id}
            learner={learner}
            voyagePath={voyageMap[learner.id] ?? null}
            isActive={currentLearner?.id === learner.id}
            onSelect={() => handleSelectLearner(learner)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0,
  },
  headerTitle: { fontSize: 28, fontWeight: "800" },
  headerSub: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  legend: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendText: { fontSize: 12, fontWeight: "500" },
  studentCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 17, fontWeight: "700" },
  cardSub: { fontSize: 13 },
  cardSchool: { fontSize: 12 },
  actionsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 6,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 11, fontWeight: "700" },
  actionStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: "absolute",
    top: 10,
    right: 14,
  },
  actionDivider: { width: 1 },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { fontSize: 15, fontWeight: "700" },
});
