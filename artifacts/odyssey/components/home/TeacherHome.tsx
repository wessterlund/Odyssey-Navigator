import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Image,
} from "react-native";

import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const TEACHER_HERO = require("@/assets/images/strawberry-hero.png");
const ADVENTURE_ICON = require("@/assets/images/adventure-icon.png");
const REWARDS_ICON = require("@/assets/images/rewards-icon.png");

const TIPS = [
  {
    id: 1,
    tag: "Strategy",
    title: "Floortime Therapy",
    body: "Floortime is child-led. The parent guides the child in play activities as a way to teach specific skills.",
    author: "Odyssey Learning",
    level: "All Level",
    emoji: "🧩",
    color: "#EBF3FF",
  },
  {
    id: 2,
    tag: "Adventure",
    title: "Visual Schedules",
    body: "Visual schedules help children with autism understand daily routines and reduce anxiety around transitions.",
    author: "Odyssey Learning",
    level: "Beginner",
    emoji: "🗓️",
    color: "#F0FFF4",
  },
  {
    id: 3,
    tag: "Rewards",
    title: "Token Economy Systems",
    body: "A token economy system helps reinforce positive behaviors by allowing children to earn tokens for desired activities.",
    author: "Odyssey Learning",
    level: "Intermediate",
    emoji: "🏆",
    color: "#FFFBEB",
  },
];

const AVATAR_COLORS = [
  "#2F80ED","#8B5CF6","#EC4899","#F59E0B","#10B981","#EF4444","#06B6D4","#F97316",
];
function getAvatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

type FeedTag = "All" | "Courses" | "Posts";

export default function TeacherHome({ topPadding }: { topPadding?: number }) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, learners, adventures, wallet, loading, refreshAll, loadLearners } = useApp();
  const [activeTag, setActiveTag] = useState<FeedTag>("All");
  const [refreshing, setRefreshing] = useState(false);

  const topInset = topPadding ?? (Platform.OS === "web" ? 67 : insets.top + 12);
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLearners();
    if (currentLearner) await refreshAll(currentLearner.id);
    setRefreshing(false);
  }, [currentLearner, loadLearners, refreshAll]);

  const filteredTips = activeTag === "All"
    ? TIPS
    : TIPS.filter((t) =>
        activeTag === "Courses" ? t.tag !== "Posts" : t.tag === "Posts"
      );

  const firstName = currentLearner?.name.split(" ")[0] ?? "there";
  const avatarColor = currentLearner ? getAvatarColor(currentLearner.id) : "#2F80ED";
  const initials = currentLearner ? getInitials(currentLearner.name) : "?";
  const activeAdventures = adventures.filter((a) => a.steps && a.steps.length > 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 12, paddingBottom: bottomInset + 90 }]}
      refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.hiLabel, { color: colors.mutedForeground }]}>Good day,</Text>
          <View style={styles.hiRow}>
            <Text style={[styles.hiName, { color: colors.foreground }]}>Hi </Text>
            <Text style={[styles.hiNameBold, { color: colors.primary }]}>{firstName}!</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.avatarBtn, { backgroundColor: avatarColor }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (currentLearner) router.push(`/profile/${currentLearner.id}`);
            else router.push("/(tabs)/students");
          }}
        >
          <Text style={styles.avatarBtnText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Hero Card ──────────────────────────────────── */}
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        {/* Left: stat number + description */}
        <View style={styles.heroLeft}>
          <Text style={styles.heroNum}>{activeAdventures.length || learners.length || 10}</Text>
          <Text style={styles.heroSub}>
            {"Students currently\non adventures"}
          </Text>
        </View>

        {/* Right: illustration + CTA button */}
        <View style={styles.heroRight}>
          <View style={styles.heroImgWrap}>
            <Image source={TEACHER_HERO} style={styles.heroImg} resizeMode="contain" />
          </View>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/teacher-hub");
            }}
          >
            <Text style={styles.heroBtnText}>Teacher's Hub</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Category Grid ──────────────────────────────── */}
      <View style={styles.catGrid}>
        <TouchableOpacity
          style={[styles.catTile, { backgroundColor: "#EBF3FF" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/adventures"); }}
          activeOpacity={0.8}
        >
          <Image source={ADVENTURE_ICON} style={styles.catImg} resizeMode="contain" />
          <Text style={[styles.catLabel, { color: colors.foreground }]}>Adventures</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.catTile, { backgroundColor: "#FEF3C7" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/rewards"); }}
          activeOpacity={0.8}
        >
          <Image source={REWARDS_ICON} style={styles.catImg} resizeMode="contain" />
          <Text style={[styles.catLabel, { color: colors.foreground }]}>Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.catTile, { backgroundColor: "#F0FFF4" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/voyage/create"); }}
          activeOpacity={0.8}
        >
          <Text style={styles.catEmoji}>🧭</Text>
          <Text style={[styles.catLabel, { color: colors.foreground }]}>Voyage Path</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Updates Feed ───────────────────────────────── */}
      <View style={styles.updatesSection}>
        <Text style={[styles.updatesTitle, { color: colors.foreground }]}>Updates</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingRight: 4 }}>
          {(["All", "Courses", "Posts"] as FeedTag[]).map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.filterChip,
                { backgroundColor: activeTag === tag ? colors.primary : "transparent", borderColor: activeTag === tag ? colors.primary : colors.border },
              ]}
              onPress={() => { Haptics.selectionAsync(); setActiveTag(tag); }}
            >
              <Text style={[styles.filterChipText, { color: activeTag === tag ? "#fff" : colors.mutedForeground }]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredTips.map((tip) => (
          <View key={tip.id} style={[styles.articleCard, { backgroundColor: colors.card }]}>
            <View style={[styles.articleBanner, { backgroundColor: tip.color }]}>
              <Text style={styles.articleBannerEmoji}>{tip.emoji}</Text>
            </View>
            <View style={styles.articleBody}>
              <Text style={[styles.articleTitle, { color: colors.foreground }]}>{tip.title}</Text>
              <Text style={[styles.articleDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{tip.body}</Text>
              <View style={styles.articleFooter}>
                <Text style={[styles.articleAuthor, { color: colors.mutedForeground }]}>By {tip.author}</Text>
                <View style={[styles.levelBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.levelText, { color: colors.mutedForeground }]}>{tip.level}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {wallet && (
          <TouchableOpacity
            style={[styles.walletCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/wallet"); }}
          >
            <View style={styles.walletLeft}>
              <Text style={styles.walletEmoji}>⭐</Text>
              <View>
                <Text style={[styles.walletTitle, { color: colors.foreground }]}>Coin Wallet</Text>
                <Text style={[styles.walletSub, { color: colors.mutedForeground }]}>{wallet.coins} coins available</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 22 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hiLabel: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  hiRow: { flexDirection: "row", alignItems: "baseline" },
  hiName: { fontSize: 28, fontWeight: "400" },
  hiNameBold: { fontSize: 28, fontWeight: "800" },
  avatarBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  /* ── Hero Card ── */
  heroCard: {
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 22,
    paddingRight: 0,
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
    minHeight: 170,
  },
  heroLeft: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  heroNum: {
    fontSize: 72,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 76,
  },
  heroSub: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 22,
  },
  heroRight: {
    width: 160,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    paddingBottom: 20,
    paddingRight: 16,
  },
  heroImgWrap: {
    width: 148,
    height: 118,
  },
  heroImg: {
    width: 148,
    height: 118,
  },
  heroBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: "stretch",
    alignItems: "center",
  },
  heroBtnText: { fontSize: 14, fontWeight: "700", color: "#2F80ED", whiteSpace: "nowrap" } as any,
  catGrid: { flexDirection: "row", gap: 12 },
  catTile: { flex: 1, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 10, alignItems: "center", gap: 8 },
  catEmoji: { fontSize: 32 },
  catImg: { width: 52, height: 44 },
  catLabel: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  updatesSection: { gap: 14 },
  updatesTitle: { fontSize: 24, fontWeight: "800" },
  filterRow: { marginHorizontal: -4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginHorizontal: 4 },
  filterChipText: { fontSize: 14, fontWeight: "600" },
  articleCard: { borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  articleBanner: { height: 130, alignItems: "center", justifyContent: "center" },
  articleBannerEmoji: { fontSize: 60 },
  articleBody: { padding: 16, gap: 6 },
  articleTitle: { fontSize: 17, fontWeight: "800" },
  articleDesc: { fontSize: 14, lineHeight: 21 },
  articleFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  articleAuthor: { fontSize: 13 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  levelText: { fontSize: 12, fontWeight: "600" },
  walletCard: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center" },
  walletLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  walletEmoji: { fontSize: 28 },
  walletTitle: { fontSize: 15, fontWeight: "700" },
  walletSub: { fontSize: 13, marginTop: 2 },
});
