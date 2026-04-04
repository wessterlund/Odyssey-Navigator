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
import { Image } from "expo-image";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase, Reward } from "@/contexts/AppContext";
import { ProgressBar } from "@/components/ProgressBar";
import * as Haptics from "expo-haptics";

export default function RewardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, wallet, loadRewards, loadWallet, loadTransactions } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [reward, setReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  useEffect(() => {
    fetchReward();
  }, [id]);

  const fetchReward = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/rewards/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setReward(data);
      setRedeemed(data.redeemed ?? false);
    } catch {
      Alert.alert("Error", "Could not load reward.");
      router.back();
    }
    setLoading(false);
  };

  const handleRedeem = () => {
    if (!reward || !currentLearner || !wallet) return;

    if (wallet.coins < reward.cost) {
      Alert.alert(
        "Not enough coins",
        `You have ${wallet.coins} coins but need ${reward.cost}. Keep completing adventures!`,
        [{ text: "OK" }]
      );
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
            setRedeeming(true);
            try {
              // Single atomic endpoint: checks balance, linked adventures, marks redeemed
              const res = await fetch(`${apiBase()}/rewards/${reward.id}/redeem`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ learnerId: currentLearner.id }),
              });

              if (!res.ok) {
                const err = await res.json().catch(() => ({ error: "Redemption failed" }));
                const msg =
                  res.status === 422
                    ? "Complete all linked adventures first before redeeming this reward."
                    : res.status === 402
                    ? `Not enough coins — you need ${err.needed ?? reward.cost} coins.`
                    : res.status === 409
                    ? "This reward has already been redeemed."
                    : err.error ?? "Failed to redeem.";
                Alert.alert("Can't Redeem", msg);
                return;
              }

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await Promise.all([
                loadWallet(currentLearner.id),
                loadRewards(currentLearner.id),
                loadTransactions(currentLearner.id),
              ]);
              setRedeemed(true);
              Alert.alert("🎉 Reward Redeemed!", `You redeemed "${reward.name}"!`, [
                { text: "Done", onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert("Error", "Failed to redeem — please check your connection.");
            }
            setRedeeming(false);
          },
        },
      ]
    );
  };

  const handlePublish = async () => {
    if (!reward) return;
    setPublishing(true);
    try {
      await fetch(`${apiBase()}/rewards/${reward.id}/publish`, { method: "PUT" });
      setReward((r) => r ? { ...r, isDraft: false, isPublished: true } : r);
      if (currentLearner) await loadRewards(currentLearner.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Published!", "This reward is now live.");
    } catch {
      Alert.alert("Error", "Failed to publish.");
    }
    setPublishing(false);
  };

  const handleDelete = () => {
    Alert.alert("Delete Reward", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            const res = await fetch(`${apiBase()}/rewards/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            if (currentLearner) await loadRewards(currentLearner.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch {
            Alert.alert("Error", "Could not delete reward — please try again.");
          } finally {
            setDeleting(false);
          }
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

  if (!reward) return null;

  const progress = Math.min(100, ((wallet?.coins ?? 0) / reward.cost) * 100);
  const canAfford = (wallet?.coins ?? 0) >= reward.cost;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {reward.isDraft && !reward.isPublished && (
            <TouchableOpacity onPress={handlePublish} disabled={publishing} style={styles.publishChip}>
              {publishing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
                  <Text style={[styles.publishChipText, { color: colors.primary }]}>Publish</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleDelete} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color={colors.destructive} />
            ) : (
              <Ionicons name="trash-outline" size={22} color={colors.destructive} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 120 }]}>
        {reward.imageUrl ? (
          <Image source={{ uri: reward.imageUrl }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: canAfford ? "#DCFCE7" : colors.secondary }]}>
            <Ionicons name="gift" size={60} color={canAfford ? "#16A34A" : colors.primary} />
          </View>
        )}

        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.foreground }]}>{reward.name}</Text>
          {reward.isDraft && (
            <View style={[styles.draftBadge, { backgroundColor: colors.coinBg }]}>
              <Text style={[styles.draftBadgeText, { color: colors.coin }]}>Draft</Text>
            </View>
          )}
          {redeemed && (
            <View style={[styles.draftBadge, { backgroundColor: "#DCFCE7" }]}>
              <Text style={[styles.draftBadgeText, { color: "#16A34A" }]}>✓ Redeemed</Text>
            </View>
          )}
        </View>

        {reward.description ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {reward.description}
          </Text>
        ) : null}

        {/* Progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.foreground }]}>Progress</Text>
            <View style={styles.coinsRow}>
              <Ionicons name="star" size={16} color={colors.coin} />
              <Text style={[styles.coinsText, { color: colors.coin }]}>
                {wallet?.coins ?? 0} / {reward.cost}
              </Text>
            </View>
          </View>
          <ProgressBar progress={progress} color={canAfford ? "#16A34A" : colors.primary} height={10} />
          {canAfford ? (
            <Text style={[styles.progressStatus, { color: "#16A34A" }]}>
              🎉 You have enough coins!
            </Text>
          ) : (
            <Text style={[styles.progressStatus, { color: colors.mutedForeground }]}>
              {reward.cost - (wallet?.coins ?? 0)} more coins needed
            </Text>
          )}
        </View>

        {/* Conditions */}
        {(reward.startDate || reward.endDate || reward.timeWindow) && (
          <View style={[styles.conditionsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.conditionsTitle, { color: colors.foreground }]}>Conditions</Text>
            {reward.startDate && (
              <View style={styles.conditionRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={[styles.conditionText, { color: colors.mutedForeground }]}>
                  Start: {reward.startDate}
                </Text>
              </View>
            )}
            {reward.endDate && (
              <View style={styles.conditionRow}>
                <Ionicons name="calendar" size={16} color={colors.primary} />
                <Text style={[styles.conditionText, { color: colors.mutedForeground }]}>
                  End: {reward.endDate}
                </Text>
              </View>
            )}
            {reward.timeWindow && (
              <View style={styles.conditionRow}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={[styles.conditionText, { color: colors.mutedForeground }]}>
                  Time: {reward.timeWindow}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {!redeemed && (
        <View style={[styles.bottomBar, { paddingBottom: bottomInset + 8, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.redeemBtn,
              { backgroundColor: canAfford ? "#16A34A" : colors.muted },
            ]}
            onPress={handleRedeem}
            disabled={!canAfford || redeeming}
          >
            {redeeming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="gift" size={22} color={canAfford ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.redeemBtnText, { color: canAfford ? "#fff" : colors.mutedForeground }]}>
                  {canAfford ? "Redeem Reward" : `${reward.cost - (wallet?.coins ?? 0)} more coins needed`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  publishChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
  },
  publishChipText: { fontSize: 13, fontWeight: "700" },
  content: { gap: 16, paddingBottom: 20 },
  heroImage: { width: "100%", height: 240 },
  heroPlaceholder: { width: "100%", height: 200, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20 },
  name: { fontSize: 24, fontWeight: "800", flex: 1 },
  draftBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  draftBadgeText: { fontSize: 12, fontWeight: "700" },
  description: { fontSize: 15, lineHeight: 22, paddingHorizontal: 20 },
  progressCard: { marginHorizontal: 20, borderRadius: 16, padding: 18, gap: 10 },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressLabel: { fontSize: 15, fontWeight: "700" },
  coinsRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  coinsText: { fontSize: 16, fontWeight: "800" },
  progressStatus: { fontSize: 13, fontWeight: "600" },
  conditionsCard: { marginHorizontal: 20, borderRadius: 16, padding: 16, gap: 10 },
  conditionsTitle: { fontSize: 15, fontWeight: "700" },
  conditionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  conditionText: { fontSize: 14 },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  redeemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  redeemBtnText: { fontSize: 17, fontWeight: "700" },
});
