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
import { CoinBadge } from "@/components/CoinBadge";
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

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function LearnerCard({
  learner,
  isActive,
  onSelect,
  onViewProfile,
  voyagePath,
}: {
  learner: Learner;
  isActive: boolean;
  onSelect: () => void;
  onViewProfile: () => void;
  voyagePath: VoyagePath | null;
}) {
  const colors = useColors();
  const router = useRouter();
  const avatarColor = getAvatarColor(learner.id);
  const initials = getInitials(learner.name);

  const handleVoyage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (voyagePath) {
      router.push(`/voyage/${voyagePath.id}`);
    } else {
      router.push("/voyage/create");
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.learnerCard,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : colors.border,
          borderWidth: isActive ? 2 : 1,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect();
      }}
    >
      <View style={styles.learnerCardTop}>
        <TouchableOpacity
          onPress={onViewProfile}
          activeOpacity={0.8}
          style={[styles.avatarCircle, { backgroundColor: avatarColor }]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>

        <View style={styles.learnerInfo}>
          <Text style={[styles.learnerCardName, { color: colors.foreground }]} numberOfLines={1}>
            {learner.name}
          </Text>
          {learner.diagnosis ? (
            <Text style={[styles.learnerCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {learner.diagnosis}
            </Text>
          ) : null}
          {learner.school ? (
            <Text style={[styles.learnerCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {learner.school}
            </Text>
          ) : null}
        </View>

        {isActive && (
          <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.voyageBtn,
          { backgroundColor: colors.primary },
        ]}
        onPress={handleVoyage}
        activeOpacity={0.85}
      >
        <Ionicons
          name={voyagePath ? "compass" : "add"}
          size={15}
          color="#fff"
        />
        <Text style={styles.voyageBtnText}>
          {voyagePath ? "View Voyage Path" : "Create Voyage Path"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, learners, adventures, wallet, rewards, loading, refreshAll, loadLearners, setCurrentLearner } = useApp();
  const [voyageMap, setVoyageMap] = useState<Record<number, VoyagePath | null>>({});
  const [refreshing, setRefreshing] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const loadVoyagesForAll = useCallback(async (ids: number[]) => {
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
    if (learners.length > 0) loadVoyagesForAll(learners.map((l) => l.id));
  }, [learners]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLearners();
    if (currentLearner) await refreshAll(currentLearner.id);
    if (learners.length > 0) await loadVoyagesForAll(learners.map((l) => l.id));
    setRefreshing(false);
  }, [currentLearner, learners, loadLearners, refreshAll, loadVoyagesForAll]);

  const handleSelectLearner = useCallback((learner: Learner) => {
    setCurrentLearner(learner);
    refreshAll(learner.id);
  }, [setCurrentLearner, refreshAll]);

  const recentAdventures = adventures.slice(0, 3);
  const unlockedRewards = rewards.filter((r) => wallet && wallet.coins >= r.cost && !r.redeemed);

  if (learners.length === 0 && !loading) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyCard, { backgroundColor: colors.card, marginTop: topInset + 20 }]}>
          <Ionicons name="compass" size={56} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Welcome to Odyssey
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Create a learner profile to get started with personalized adventures
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/profile/create");
            }}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
              Create Learner Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 12, paddingBottom: bottomInset + 90 },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Learners</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {learners.length} {learners.length === 1 ? "student" : "students"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {currentLearner && wallet && <CoinBadge amount={wallet.coins} size="lg" />}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/profile/create");
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Learner Cards */}
      <View style={styles.learnerCards}>
        {learners.map((learner) => (
          <LearnerCard
            key={learner.id}
            learner={learner}
            isActive={currentLearner?.id === learner.id}
            onSelect={() => handleSelectLearner(learner)}
            onViewProfile={() => {
              handleSelectLearner(learner);
              router.push(`/profile/${learner.id}`);
            }}
            voyagePath={voyageMap[learner.id] ?? null}
          />
        ))}
      </View>

      {/* Divider */}
      {currentLearner && (
        <View style={[styles.divider, { borderColor: colors.border }]}>
          <Text style={[styles.dividerLabel, { color: colors.mutedForeground }]}>
            {currentLearner.name}'s Overview
          </Text>
        </View>
      )}

      {currentLearner && (
        <>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="map" size={22} color={colors.primary} />
              <Text style={[styles.statNum, { color: colors.foreground }]}>{adventures.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Adventures</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="star" size={22} color={colors.coin} />
              <Text style={[styles.statNum, { color: colors.foreground }]}>{wallet?.lifetimeCoins ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Earned</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="gift" size={22} color={colors.success} />
              <Text style={[styles.statNum, { color: colors.foreground }]}>{unlockedRewards.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Unlocked</Text>
            </View>
          </View>

          {/* Recent Adventures */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Adventures</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/adventures")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentAdventures.length === 0 ? (
              <TouchableOpacity
                style={[styles.emptyAdventureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/adventure/create");
                }}
              >
                <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
                <Text style={[styles.emptyAdventureText, { color: colors.mutedForeground }]}>
                  Create your first adventure
                </Text>
              </TouchableOpacity>
            ) : (
              recentAdventures.map((adventure) => (
                <TouchableOpacity
                  key={adventure.id}
                  style={[styles.adventureCard, { backgroundColor: colors.card }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/adventure/${adventure.id}`);
                  }}
                >
                  <View style={[styles.adventureIcon, { backgroundColor: colors.primary + "18" }]}>
                    <Ionicons name="map-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.adventureCardLeft}>
                    <Text style={[styles.adventureTitle, { color: colors.foreground }]}>
                      {adventure.title}
                    </Text>
                    {adventure.description && (
                      <Text
                        style={[styles.adventureDesc, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {adventure.description}
                      </Text>
                    )}
                    <Text style={[styles.adventureSteps, { color: colors.mutedForeground }]}>
                      {adventure.steps?.length ?? 0} steps
                    </Text>
                  </View>
                  <View style={styles.adventureCardRight}>
                    <CoinBadge amount={adventure.coinsPerStep} size="sm" />
                    <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Rewards Preview */}
          {rewards.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rewards</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/rewards")}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rewardsRow}>
                {rewards.slice(0, 5).map((reward) => {
                  const canAfford = wallet && wallet.coins >= reward.cost;
                  return (
                    <View
                      key={reward.id}
                      style={[
                        styles.rewardChip,
                        {
                          backgroundColor: colors.card,
                          borderColor: canAfford ? colors.success : colors.border,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name="gift"
                        size={20}
                        color={canAfford ? colors.success : colors.mutedForeground}
                      />
                      <Text
                        style={[styles.rewardName, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {reward.name}
                      </Text>
                      <Text style={[styles.rewardCost, { color: colors.mutedForeground }]}>
                        {reward.cost} coins
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/adventure/create");
              }}
            >
              <Ionicons name="sparkles" size={20} color={colors.primaryForeground} />
              <Text style={[styles.quickBtnText, { color: colors.primaryForeground }]}>
                New Adventure
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyCard: {
    width: "100%",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  emptyTitle: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  primaryBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: "700" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 28, fontWeight: "800" },
  headerSub: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  learnerCards: { gap: 12 },
  learnerCard: {
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  learnerCardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  learnerInfo: { flex: 1, gap: 3 },
  learnerCardName: { fontSize: 17, fontWeight: "700" },
  learnerCardSub: { fontSize: 13 },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
  voyageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  voyageBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  divider: {
    borderTopWidth: 1,
    paddingTop: 14,
  },
  dividerLabel: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statNum: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 11, fontWeight: "500" },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  seeAll: { fontSize: 14, fontWeight: "600" },
  emptyAdventureCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyAdventureText: { fontSize: 14, fontWeight: "500" },
  adventureCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  adventureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  adventureCardLeft: { flex: 1, gap: 3 },
  adventureTitle: { fontSize: 15, fontWeight: "700" },
  adventureDesc: { fontSize: 13 },
  adventureSteps: { fontSize: 12 },
  adventureCardRight: { alignItems: "center", gap: 6 },
  rewardsRow: { marginHorizontal: -4 },
  rewardChip: {
    width: 130,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    gap: 6,
  },
  rewardName: { fontSize: 13, fontWeight: "600" },
  rewardCost: { fontSize: 11 },
  quickActions: { gap: 10 },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  quickBtnText: { fontSize: 16, fontWeight: "700" },
});
