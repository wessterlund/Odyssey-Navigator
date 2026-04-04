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
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase, Reward } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_GAP = 12;
const CARD_H_PAD = 20;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_H_PAD * 2 - CARD_GAP) / 2;

const TEMPLATE_COLORS = [
  "#C8E6C9", "#BBDEFB", "#F8BBD0", "#FFE0B2",
  "#E1BEE7", "#B2EBF2", "#DCEDC8", "#FFE082",
];

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
                    ? `Not enough coins — need ${err.needed ?? reward.cost}.`
                    : res.status === 409
                    ? "This reward has already been redeemed."
                    : err.error ?? "Failed to redeem reward.";
                Alert.alert("Can't Redeem", msg);
                return;
              }

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await Promise.all([
                loadWallet(currentLearner.id),
                loadRewards(currentLearner.id),
                loadTransactions(currentLearner.id),
              ]);
              Alert.alert("🎉 Reward Redeemed!", `You redeemed "${reward.name}"!`);
            } catch {
              Alert.alert("Error", "Failed to redeem — please check your connection.");
            }
            setRedeemingId(null);
          },
        },
      ]
    );
  };

  const deleteReward = (id: number, name: string) => {
    const showAlert = () => {
      Alert.alert("Delete Reward", `Delete "${name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${apiBase()}/rewards/${id}`, { method: "DELETE" });
              if (!res.ok) throw new Error(`Server error ${res.status}`);
              if (currentLearner) await loadRewards(currentLearner.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch {
              Alert.alert("Error", "Could not delete reward — please try again.");
            }
          },
        },
      ]);
    };
    // On Android, the GestureHandler holds the active touch event; delaying by
    // one frame lets it settle so Alert.alert isn't swallowed. On web/iOS the
    // alert must stay in the synchronous gesture callback or the browser blocks it.
    if (Platform.OS === "android") {
      setTimeout(showAlert, 50);
    } else {
      showAlert();
    }
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
  const previewTemplates = templates.slice(0, 4);

  return (
    <View style={[styles.container, { backgroundColor: "#fff" }]}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() && router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rewards</Text>
        <View style={styles.backBtn} />
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
        showsVerticalScrollIndicator={false}
      >
        {/* ── REWARDS (published) ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rewards</Text>
          {published.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="gift-outline" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyCardText, { color: colors.mutedForeground }]}>
                No active rewards yet
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {published.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  wallet={wallet}
                  redeemingId={redeemingId}
                  colors={colors}
                  onPress={() => router.push(`/reward/${reward.id}`)}
                  onRedeem={() => redeemReward(reward)}
                  onDelete={() => deleteReward(reward.id, reward.name)}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── DRAFTS ── */}
        {drafts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Drafts</Text>
              <TouchableOpacity>
                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {drafts.slice(0, 4).map((reward) => (
                <ContentCard
                  key={reward.id}
                  imageUrl={reward.imageUrl ?? null}
                  name={reward.name}
                  subtitle="Continue"
                  placeholderColor={TEMPLATE_COLORS[reward.id % TEMPLATE_COLORS.length]}
                  colors={colors}
                  onPress={() => router.push(`/reward/${reward.id}`)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── COMMUNITY TEMPLATES ── */}
        {previewTemplates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community templates</Text>
              <TouchableOpacity>
                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {previewTemplates.map((t, index) => (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.85}
                  onPress={() => addFromTemplate(index)}
                  disabled={addingTemplate === index}
                >
                  <View style={[styles.contentCard, { backgroundColor: colors.card }]}>
                    <View
                      style={[
                        styles.contentCardImage,
                        { backgroundColor: TEMPLATE_COLORS[index % TEMPLATE_COLORS.length] },
                      ]}
                    >
                      {addingTemplate === index ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <Ionicons name="gift-outline" size={32} color="rgba(0,0,0,0.35)" />
                      )}
                    </View>
                    <View style={styles.contentCardBody}>
                      <Text style={[styles.contentCardName, { color: colors.foreground }]} numberOfLines={2}>
                        {t.name}
                      </Text>
                      <Text style={[styles.contentCardSub, { color: colors.mutedForeground }]}>
                        By Phil G
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── ADD NEW REWARD ── */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/reward/create")}
          activeOpacity={0.88}
        >
          <Text style={styles.addBtnText}>Add new reward</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ─── Sub-components ─── */

function RewardCard({
  reward,
  wallet,
  redeemingId,
  colors,
  onPress,
  onRedeem,
  onDelete,
}: {
  reward: Reward;
  wallet: any;
  redeemingId: number | null;
  colors: any;
  onPress: () => void;
  onRedeem: () => void;
  onDelete: () => void;
}) {
  const canAfford = (wallet?.coins ?? 0) >= reward.cost;
  const isRedeeming = redeemingId === reward.id;

  return (
    // Wrapper holds the card + the delete button, so the button is outside
    // overflow:hidden and renders correctly above the card image
    <View style={styles.rewardCardWrapper}>
      <TouchableOpacity
        style={[styles.contentCard, { backgroundColor: colors.card }]}
        activeOpacity={0.88}
        onPress={onPress}
      >
        {reward.imageUrl ? (
          <Image
            source={{ uri: reward.imageUrl }}
            style={styles.contentCardImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.contentCardImage, { backgroundColor: canAfford ? "#DCFCE7" : "#EEF2FF" }]} />
        )}
        <View style={styles.contentCardBody}>
          <Text style={[styles.contentCardName, { color: colors.foreground }]} numberOfLines={2}>
            {reward.name}
          </Text>
          <View style={styles.coinRow}>
            <View style={[styles.coinBadge, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="star" size={12} color="#F59E0B" />
            </View>
            <Text style={[styles.coinCount, { color: colors.foreground }]}>{reward.cost}</Text>
          </View>
          {reward.redeemed && (
            <Text style={styles.redeemedLabel}>✓ Redeemed</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Trash button — sits outside overflow:hidden so it renders above the image */}
      <TouchableOpacity
        style={styles.cardDeleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Ionicons name="trash-outline" size={13} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

function ContentCard({
  imageUrl,
  name,
  subtitle,
  placeholderColor,
  colors,
  onPress,
}: {
  imageUrl: string | null;
  name: string;
  subtitle: string;
  placeholderColor: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.contentCard, { backgroundColor: colors.card }]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.contentCardImage} contentFit="cover" />
      ) : (
        <View style={[styles.contentCardImage, { backgroundColor: placeholderColor }]}>
          <Ionicons name="gift-outline" size={32} color="rgba(0,0,0,0.3)" />
        </View>
      )}
      <View style={styles.contentCardBody}>
        <Text style={[styles.contentCardName, { color: colors.foreground }]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={[styles.contentCardSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14 },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },

  scrollContent: { paddingTop: 8, gap: 24 },

  section: { paddingHorizontal: CARD_H_PAD, gap: 14 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  viewAll: { fontSize: 14, fontWeight: "500" },

  emptyCard: {
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyCardText: { fontSize: 14 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },

  rewardCardWrapper: {
    width: CARD_WIDTH,
    position: "relative",
  },
  contentCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: "#fff",
  },
  cardDeleteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.88)",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  contentCardImage: {
    width: "100%",
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  contentCardBody: {
    padding: 10,
    gap: 4,
  },
  contentCardName: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  contentCardSub: { fontSize: 12, fontWeight: "400" },

  coinRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  coinBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  coinCount: { fontSize: 14, fontWeight: "700" },
  redeemedLabel: { fontSize: 11, fontWeight: "700", color: "#16A34A", marginTop: 2 },

  addBtn: {
    marginHorizontal: CARD_H_PAD,
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
