import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase } from "@/contexts/AppContext";
import { ProgressBar } from "@/components/ProgressBar";
import * as Haptics from "expo-haptics";

export default function RewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentLearner, wallet, rewards, loading, loadRewards, loadWallet, loadTransactions } = useApp();
  const [suggestingRewards, setSuggestingRewards] = useState(false);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (currentLearner) loadRewards(currentLearner.id);
  }, [currentLearner?.id]);

  const suggestRewards = async () => {
    if (!currentLearner) return;
    setSuggestingRewards(true);
    try {
      const res = await fetch(`${apiBase()}/ai/suggest-rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId: currentLearner.id }),
      });
      const data = await res.json();
      const all = [
        ...(data.smallRewards || []),
        ...(data.mediumRewards || []),
        ...(data.bigRewards || []),
      ].map((r: any) => ({ ...r, learnerId: currentLearner.id }));

      if (all.length > 0) {
        await fetch(`${apiBase()}/rewards/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rewards: all }),
        });
        await loadRewards(currentLearner.id);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to get reward suggestions");
    }
    setSuggestingRewards(false);
  };

  const redeemReward = async (reward: { id: number; name: string; cost: number }) => {
    if (!currentLearner || !wallet) return;
    if (wallet.coins < reward.cost) {
      Alert.alert("Not enough coins", `You need ${reward.cost} coins to redeem this reward.`);
      return;
    }
    setRedeemingId(reward.id);
    try {
      await fetch(`${apiBase()}/wallet/learner/${currentLearner.id}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: reward.cost, note: `Redeemed: ${reward.name}` }),
      });
      await fetch(`${apiBase()}/rewards/${reward.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redeemed: true }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadWallet(currentLearner.id);
      await loadRewards(currentLearner.id);
      await loadTransactions(currentLearner.id);
    } catch (e) {
      Alert.alert("Error", "Failed to redeem reward");
    }
    setRedeemingId(null);
  };

  if (!currentLearner) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="gift-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Select a learner first</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Rewards</Text>
        <TouchableOpacity
          style={[styles.suggestBtn, { backgroundColor: colors.secondary }]}
          onPress={suggestRewards}
          disabled={suggestingRewards}
        >
          {suggestingRewards ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.suggestBtnText, { color: colors.primary }]}>AI Suggest</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {wallet && (
        <View style={[styles.walletStrip, { backgroundColor: colors.coinBg, marginHorizontal: 20 }]}>
          <Ionicons name="star" size={18} color={colors.coin} />
          <Text style={[styles.walletText, { color: colors.coin }]}>
            {wallet.coins} coins available
          </Text>
        </View>
      )}

      <FlatList
        data={rewards}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomInset + 90 },
        ]}
        scrollEnabled={!!rewards.length}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadRewards(currentLearner.id)}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="gift-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Rewards Yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap "AI Suggest" to get personalized reward ideas
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const pct = wallet ? Math.min(100, (wallet.coins / item.cost) * 100) : 0;
          const canAfford = wallet && wallet.coins >= item.cost;
          const isRedeeming = redeemingId === item.id;

          return (
            <View
              style={[
                styles.rewardCard,
                {
                  backgroundColor: colors.card,
                  opacity: item.redeemed ? 0.5 : 1,
                },
              ]}
            >
              <View style={[styles.rewardIcon, { backgroundColor: canAfford ? "#DCFCE7" : colors.secondary }]}>
                <Ionicons
                  name="gift"
                  size={24}
                  color={canAfford ? colors.success : colors.primary}
                />
              </View>
              <View style={styles.rewardContent}>
                <Text style={[styles.rewardName, { color: colors.foreground }]}>{item.name}</Text>
                <View style={styles.costRow}>
                  <Ionicons name="star" size={13} color={colors.coin} />
                  <Text style={[styles.costText, { color: colors.mutedForeground }]}>
                    {item.cost} coins
                  </Text>
                </View>
                <ProgressBar progress={pct} color={canAfford ? colors.success : colors.primary} height={5} />
                {item.redeemed && (
                  <Text style={[styles.redeemedText, { color: colors.success }]}>Redeemed!</Text>
                )}
              </View>
              {!item.redeemed && (
                <TouchableOpacity
                  style={[
                    styles.redeemBtn,
                    {
                      backgroundColor: canAfford ? colors.success : colors.muted,
                    },
                  ]}
                  onPress={() => redeemReward(item)}
                  disabled={!canAfford || isRedeeming}
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={canAfford ? colors.primaryForeground : colors.mutedForeground}
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: "700" },
  suggestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestBtnText: { fontSize: 14, fontWeight: "600" },
  walletStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  walletText: { fontSize: 14, fontWeight: "700" },
  list: { paddingHorizontal: 20, gap: 10 },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
  emptyText: { fontSize: 14 },
  rewardCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  rewardContent: { flex: 1, gap: 5 },
  rewardName: { fontSize: 15, fontWeight: "700" },
  costRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  costText: { fontSize: 12 },
  redeemedText: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  redeemBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
