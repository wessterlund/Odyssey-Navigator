import React, { useEffect } from "react";
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
import { useApp } from "@/contexts/AppContext";
import { CoinBadge } from "@/components/CoinBadge";
import { ProgressBar } from "@/components/ProgressBar";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, learners, adventures, wallet, rewards, loading, refreshAll, loadLearners } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    loadLearners();
  }, []);

  const onRefresh = async () => {
    if (currentLearner) {
      await refreshAll(currentLearner.id);
    } else {
      await loadLearners();
    }
  };

  const recentAdventures = adventures.slice(0, 3);
  const unlockedRewards = rewards.filter((r) => wallet && wallet.coins >= r.cost && !r.redeemed);

  if (!currentLearner) {
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
        { paddingTop: topInset + 16, paddingBottom: bottomInset + 90 },
      ]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good day,</Text>
          <Text style={[styles.learnerName, { color: colors.foreground }]}>
            {currentLearner.name}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {wallet && <CoinBadge amount={wallet.coins} size="lg" />}
        </View>
      </View>

      {/* Learner Switcher */}
      {learners.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.learnerRow}>
          {learners.map((l) => {
            const isActive = l.id === currentLearner.id;
            return (
              <TouchableOpacity
                key={l.id}
                style={[
                  styles.learnerChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  // handled in AppContext via setCurrentLearner
                }}
              >
                <Text
                  style={[
                    styles.learnerChipText,
                    { color: isActive ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {l.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {rewards.slice(0, 5).map((reward) => {
              const canAfford = wallet && wallet.coins >= reward.cost;
              const pct = wallet ? Math.min(100, (wallet.coins / reward.cost) * 100) : 0;
              return (
                <View
                  key={reward.id}
                  style={[styles.rewardChip, { backgroundColor: colors.card }]}
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
                  <ProgressBar progress={pct} color={canAfford ? colors.success : colors.primary} height={4} />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyCard: {
    width: "100%",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyTitle: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  primaryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 13, fontWeight: "500" },
  learnerName: { fontSize: 26, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  learnerRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  learnerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  learnerChipText: { fontSize: 14, fontWeight: "600" },
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
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  adventureCardLeft: { flex: 1, gap: 3 },
  adventureTitle: { fontSize: 15, fontWeight: "700" },
  adventureDesc: { fontSize: 13 },
  adventureSteps: { fontSize: 12 },
  adventureCardRight: { alignItems: "center", gap: 6 },
  rewardChip: {
    width: 130,
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
