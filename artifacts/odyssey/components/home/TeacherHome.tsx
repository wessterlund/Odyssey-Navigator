import React, { useState, useCallback } from "react";
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
import { useApp, apiBase } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const TIPS = [
  {
    id: 1,
    tag: "Strategy",
    tagBg: "#EBF3FF",
    tagColor: "#2F80ED",
    title: "Floortime Therapy",
    body: "Floortime is child-led. The parent guides the child in play as a way to teach specific skills.",
    author: "Odyssey Learning",
    level: "All Level",
  },
  {
    id: 2,
    tag: "Adventure",
    tagBg: "#FFF7ED",
    tagColor: "#EA580C",
    title: "Visual Schedules",
    body: "Visual schedules help children with autism understand daily routines and reduce anxiety around transitions.",
    author: "Odyssey Learning",
    level: "Beginner",
  },
  {
    id: 3,
    tag: "Rewards",
    tagBg: "#ECFDF5",
    tagColor: "#059669",
    title: "Token Economy Systems",
    body: "A token economy system helps reinforce positive behaviors by allowing children to earn tokens.",
    author: "Odyssey Learning",
    level: "Intermediate",
  },
];

const QUICK_ACTIONS = [
  {
    label: "Adventures",
    subtitle: "Manage student maps",
    iconName: "map-outline" as const,
    iconBg: "#FFF7ED",
    iconColor: "#F97316",
    route: "/(tabs)/adventures" as const,
  },
  {
    label: "Rewards",
    subtitle: "Send tokens & gifts",
    iconName: "gift-outline" as const,
    iconBg: "#ECFDF5",
    iconColor: "#059669",
    route: "/(tabs)/rewards" as const,
  },
  {
    label: "Voyage Path",
    subtitle: "Track learning journey",
    iconName: "rocket-outline" as const,
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
    route: "/voyage/create" as const,
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

        <View style={styles.headerRight}>
          {/* Bell icon with notification dot */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
            <View style={styles.notifDot} />
          </TouchableOpacity>

          {/* Avatar with blue border */}
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: avatarColor, borderColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (currentLearner) router.push(`/profile/${currentLearner.id}`);
              else router.push("/(tabs)/students");
            }}
          >
            <Text style={styles.avatarBtnText}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Compact Hero Card ──────────────────────────── */}
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.heroLeft}>
          <View style={styles.heroCountBox}>
            <Text style={styles.heroCountText}>
              {activeAdventures.length || learners.length || 5}
            </Text>
          </View>
          <View>
            <Text style={styles.heroSubLine}>Students on</Text>
            <Text style={styles.heroSubLine}>adventures</Text>
          </View>
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

      {/* ─── Quick Actions (List Rows) ───────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.actionList}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionRow, { backgroundColor: colors.card }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(action.route as any);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.iconBg }]}>
                <Ionicons name={action.iconName} size={24} color={action.iconColor} />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
                <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>{action.subtitle}</Text>
              </View>
              <View style={[styles.chevronBox, { backgroundColor: colors.secondary }]}>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─── Updates Feed ───────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Updates</Text>
          <TouchableOpacity onPress={() => Haptics.selectionAsync()}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingRight: 4 }}>
          {(["All", "Courses", "Posts"] as FeedTag[]).map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.filterChip,
                { backgroundColor: activeTag === tag ? "#1A1A1A" : "#fff", borderColor: activeTag === tag ? "#1A1A1A" : colors.border },
              ]}
              onPress={() => { Haptics.selectionAsync(); setActiveTag(tag); }}
            >
              <Text style={[styles.filterChipText, { color: activeTag === tag ? "#fff" : colors.mutedForeground }]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.feedList}>
          {filteredTips.map((tip) => (
            <TouchableOpacity
              key={tip.id}
              style={[styles.articleCard, { backgroundColor: colors.card }]}
              activeOpacity={0.85}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={[styles.articleTagBadge, { backgroundColor: tip.tagBg }]}>
                <Text style={[styles.articleTagText, { color: tip.tagColor }]}>{tip.tag}</Text>
              </View>
              <Text style={[styles.articleTitle, { color: colors.foreground }]}>{tip.title}</Text>
              <Text style={[styles.articleDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{tip.body}</Text>
              <View style={styles.articleFooter}>
                <Text style={[styles.articleAuthor, { color: colors.mutedForeground }]}>{tip.author}</Text>
                <View style={styles.articleDot} />
                <Text style={[styles.articleLevel, { color: colors.mutedForeground }]}>{tip.level}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

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

  /* ── Header ── */
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hiLabel: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  hiRow: { flexDirection: "row", alignItems: "baseline" },
  hiName: { fontSize: 28, fontWeight: "400" },
  hiNameBold: { fontSize: 28, fontWeight: "800" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  bellBtn: { position: "relative", padding: 4 },
  notifDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },

  /* ── Compact Hero Card ── */
  heroCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 80,
    overflow: "hidden",
  },
  heroLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroCountBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCountText: { fontSize: 22, fontWeight: "900", color: "#fff" },
  heroSubLine: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.9)", lineHeight: 20 },
  heroBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
  },
  heroBtnText: { fontSize: 13, fontWeight: "700", color: "#2F80ED" },

  /* ── Section ── */
  section: { gap: 14 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  viewAll: { fontSize: 14, fontWeight: "600" },

  /* ── Quick Actions ── */
  actionList: { gap: 10 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, gap: 2 },
  actionLabel: { fontSize: 16, fontWeight: "700" },
  actionSub: { fontSize: 12 },
  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Filter chips ── */
  filterRow: { marginHorizontal: -4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginHorizontal: 4 },
  filterChipText: { fontSize: 14, fontWeight: "600" },

  /* ── Article cards (text-only) ── */
  feedList: { gap: 12 },
  articleCard: {
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  articleTagBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  articleTagText: { fontSize: 11, fontWeight: "700" },
  articleTitle: { fontSize: 16, fontWeight: "800", lineHeight: 22 },
  articleDesc: { fontSize: 13, lineHeight: 20 },
  articleFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  articleAuthor: { fontSize: 12, fontWeight: "500" },
  articleDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#CBD5E1" },
  articleLevel: { fontSize: 12, fontWeight: "500" },

  /* ── Wallet card ── */
  walletCard: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center" },
  walletLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  walletEmoji: { fontSize: 28 },
  walletTitle: { fontSize: 15, fontWeight: "700" },
  walletSub: { fontSize: 13, marginTop: 2 },
});
