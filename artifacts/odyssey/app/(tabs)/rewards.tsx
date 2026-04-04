import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase, Reward } from "@/contexts/AppContext";
import { ProgressBar } from "@/components/ProgressBar";
import * as Haptics from "expo-haptics";

interface CommunityTemplate {
  id: number;
  name: string;
  description: string;
  cost: number;
  isTemplate: true;
}

export default function RewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentLearner, wallet, rewards, loading, loadRewards, loadWallet, loadTransactions } = useApp();
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [addingTemplate, setAddingTemplate] = useState<number | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (currentLearner) loadRewards(currentLearner.id);
    fetchTemplates();
  }, [currentLearner?.id]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${apiBase()}/rewards/community-templates`);
      const data = await res.json();
      setTemplates(data);
    } catch {}
  };

  const addFromTemplate = async (templateIndex: number) => {
    if (!currentLearner) return;
    setAddingTemplate(templateIndex);
    try {
      const res = await fetch(`${apiBase()}/rewards/from-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateIndex, learnerId: currentLearner.id }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadRewards(currentLearner.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Added!", "Reward added to drafts. Tap to edit and publish.");
    } catch {
      Alert.alert("Error", "Could not add template.");
    }
    setAddingTemplate(null);
  };

  const redeemReward = async (reward: Reward) => {
    if (!currentLearner || !wallet) return;
    if (wallet.coins < reward.cost) {
      Alert.alert("Not enough coins", `You need ${reward.cost - wallet.coins} more coins.`);
      return;
    }
    Alert.alert(
      "Redeem Reward",
      `Redeem "${reward.name}" for ${reward.cost} coins?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem!",
          onPress: async () => {
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
              Alert.alert("🎉 Reward Redeemed!", `You redeemed "${reward.name}"!`);
            } catch {
              Alert.alert("Error", "Failed to redeem reward");
            }
            setRedeemingId(null);
          },
        },
      ]
    );
  };

  const deleteReward = (id: number, name: string) => {
    Alert.alert("Delete Reward", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await fetch(`${apiBase()}/rewards/${id}`, { method: "DELETE" });
          if (currentLearner) await loadRewards(currentLearner.id);
        },
      },
    ]);
  };

  if (!currentLearner) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="gift-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Select a learner first</Text>
      </View>
    );
  }

  const published = rewards.filter((r) => r.isPublished && !r.isDraft);
  const drafts = rewards.filter((r) => r.isDraft || !r.isPublished);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Rewards</Text>
        {wallet && (
          <View style={[styles.coinPill, { backgroundColor: colors.coinBg }]}>
            <Ionicons name="star" size={15} color={colors.coin} />
            <Text style={[styles.coinPillText, { color: colors.coin }]}>{wallet.coins}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadRewards(currentLearner.id)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Published Rewards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Active Rewards
          </Text>
          {published.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="gift-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyCardTitle, { color: colors.foreground }]}>No active rewards</Text>
              <Text style={[styles.emptyCardSub, { color: colors.mutedForeground }]}>
                Add a new reward below or use a community template
              </Text>
            </View>
          ) : (
            published.map((reward) => {
              const pct = Math.min(100, ((wallet?.coins ?? 0) / reward.cost) * 100);
              const canAfford = (wallet?.coins ?? 0) >= reward.cost;
              const isRedeeming = redeemingId === reward.id;
              return (
                <TouchableOpacity
                  key={reward.id}
                  style={[styles.rewardCard, { backgroundColor: colors.card }]}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/reward/${reward.id}`)}
                >
                  {reward.imageUrl ? (
                    <Image source={{ uri: reward.imageUrl }} style={styles.rewardImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.rewardImagePlaceholder, { backgroundColor: canAfford ? "#DCFCE7" : colors.secondary }]}>
                      <Ionicons name="gift" size={28} color={canAfford ? "#16A34A" : colors.primary} />
                    </View>
                  )}
                  <View style={styles.rewardBody}>
                    <View style={styles.rewardTitleRow}>
                      <Text style={[styles.rewardName, { color: colors.foreground }]} numberOfLines={1}>
                        {reward.name}
                      </Text>
                      {canAfford && !reward.redeemed && (
                        <View style={styles.unlockedBadge}>
                          <Text style={styles.unlockedText}>Unlocked!</Text>
                        </View>
                      )}
                    </View>
                    {reward.description ? (
                      <Text style={[styles.rewardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {reward.description}
                      </Text>
                    ) : null}
                    <View style={styles.costRow}>
                      <Ionicons name="star" size={13} color={colors.coin} />
                      <Text style={[styles.costText, { color: colors.mutedForeground }]}>
                        {wallet?.coins ?? 0} / {reward.cost} coins
                      </Text>
                    </View>
                    <ProgressBar
                      progress={pct}
                      color={canAfford ? "#16A34A" : colors.primary}
                      height={6}
                    />
                    {reward.redeemed && (
                      <Text style={[styles.redeemedLabel, { color: "#16A34A" }]}>✓ Redeemed</Text>
                    )}
                  </View>
                  <View style={styles.rewardActions}>
                    {!reward.redeemed ? (
                      <TouchableOpacity
                        style={[
                          styles.redeemBtn,
                          { backgroundColor: canAfford ? "#16A34A" : colors.muted },
                        ]}
                        onPress={() => redeemReward(reward)}
                        disabled={!canAfford || isRedeeming}
                      >
                        {isRedeeming ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={canAfford ? "#fff" : colors.mutedForeground}
                          />
                        )}
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => deleteReward(reward.id, reward.name)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Add New Reward Button */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/reward/create")}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>Add new reward</Text>
        </TouchableOpacity>

        {/* Drafts */}
        {drafts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Drafts</Text>
            {drafts.map((reward) => (
              <TouchableOpacity
                key={reward.id}
                style={[styles.draftCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/reward/${reward.id}`)}
              >
                <View style={[styles.draftDot, { backgroundColor: colors.coin }]} />
                <Text style={[styles.draftName, { color: colors.foreground }]} numberOfLines={1}>
                  {reward.name}
                </Text>
                <Text style={[styles.draftCost, { color: colors.mutedForeground }]}>
                  {reward.cost} coins
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Community Templates */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community templates</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Tap any template to add it to your drafts
          </Text>
          <View style={styles.templatesGrid}>
            {templates.map((t, index) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.templateCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => addFromTemplate(index)}
                disabled={addingTemplate === index}
              >
                <View style={[styles.templateIcon, { backgroundColor: colors.secondary }]}>
                  {addingTemplate === index ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="gift-outline" size={20} color={colors.primary} />
                  )}
                </View>
                <Text style={[styles.templateName, { color: colors.foreground }]} numberOfLines={2}>
                  {t.name}
                </Text>
                <Text style={[styles.templateCost, { color: colors.coin }]}>
                  {t.cost} coins
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14 },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontWeight: "800" },
  coinPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  coinPillText: { fontSize: 15, fontWeight: "800" },
  scrollContent: { paddingTop: 16, gap: 8 },
  section: { paddingHorizontal: 20, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sectionSub: { fontSize: 13, marginTop: -4 },
  emptyCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyCardTitle: { fontSize: 16, fontWeight: "700" },
  emptyCardSub: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  rewardCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  rewardImage: { width: "100%", height: 140 },
  rewardImagePlaceholder: {
    width: "100%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardBody: { padding: 14, gap: 7 },
  rewardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rewardName: { fontSize: 16, fontWeight: "800", flex: 1 },
  unlockedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unlockedText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  rewardDesc: { fontSize: 13, lineHeight: 18 },
  costRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  costText: { fontSize: 12, fontWeight: "600" },
  redeemedLabel: { fontSize: 12, fontWeight: "700" },
  rewardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  redeemBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: { padding: 8 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  draftCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  draftDot: { width: 8, height: 8, borderRadius: 4 },
  draftName: { flex: 1, fontSize: 15, fontWeight: "600" },
  draftCost: { fontSize: 13 },
  templatesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  templateCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  templateName: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  templateCost: { fontSize: 13, fontWeight: "700" },
});
