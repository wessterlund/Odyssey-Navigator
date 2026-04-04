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
import { useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const ADVENTURE_ICON = require("@/assets/images/adventure-icon.png");
const REWARDS_ICON = require("@/assets/images/rewards-icon.png");

const AVATAR_COLORS = [
  "#2F80ED","#8B5CF6","#EC4899","#F59E0B","#10B981","#EF4444","#06B6D4","#F97316",
];
function getAvatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const PARENT_CATEGORIES = [
  { label: "Adventures",  emoji: "🗺️", illBg: "#E4EDFF", route: "/(tabs)/adventures" as const },
  { label: "Rewards",     emoji: "🎁", illBg: "#FDEEE6", route: "/(tabs)/rewards" as const },
  { label: "Mood Captain",emoji: "😊", illBg: "#FDF4FF", route: null },
  { label: "Learning",    emoji: "📚", illBg: "#F0FFF4", route: null },
  { label: "Community",   emoji: "👥", illBg: "#FFF7ED", route: null },
  { label: "Scheduler",   emoji: "📅", illBg: "#EFF6FF", route: "/scheduler" as const },
];

const TODAY_SCHEDULE = [
  { id: 1, title: "Breakfast Adventure", time: "07:00 – 09:00 AM", icon: "🍳" },
  { id: 2, title: "Regular Class",        time: "01:00 – 04:00 PM", icon: "📖" },
  { id: 3, title: "Parent Training",      time: "06:00 – 06:30 PM", icon: "🎓" },
];

const PARENT_UPDATES = [
  {
    id: 1,
    tag: "Mood",
    title: "Meltdown due to TV noise",
    body: "Antecedent: Background noise from the television. Behaviors: Crying, shouting, hitting himself. Consequence: The TV is turned off which eventually calmed him down.",
    author: "Sarah William",
    badge: "Template",
    emoji: "😤",
    color: "#FFF1F2",
  },
  {
    id: 2,
    tag: "Schedule",
    title: "Morning Routine Completed",
    body: "Carlo successfully completed all 6 steps of the morning tooth-brushing routine without prompting today.",
    author: "Odyssey System",
    badge: "Achievement",
    emoji: "🌟",
    color: "#FFFBEB",
  },
  {
    id: 3,
    tag: "Lessons",
    title: "New Coping Strategy Unlocked",
    body: "Carlo has been introduced to the 'deep breath' calming technique. Practice this at home during low-stress moments.",
    author: "Odyssey Learning",
    badge: "Tip",
    emoji: "🧘",
    color: "#F0FFF4",
  },
];

type UpdateTag = "All" | "Mood" | "Schedule" | "Lessons";

export default function ParentHome({ topPadding }: { topPadding?: number }) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, adventures, wallet, loading, refreshAll, loadLearners } = useApp();
  const [activeTag, setActiveTag] = useState<UpdateTag>("All");
  const [refreshing, setRefreshing] = useState(false);

  const topInset = topPadding ?? (Platform.OS === "web" ? 67 : insets.top + 12);
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLearners();
    if (currentLearner) await refreshAll(currentLearner.id);
    setRefreshing(false);
  }, [currentLearner, loadLearners, refreshAll]);

  const firstName = currentLearner?.name.split(" ")[0] ?? "there";
  const avatarColor = currentLearner ? getAvatarColor(currentLearner.id) : "#2F80ED";
  const initials = currentLearner ? getInitials(currentLearner.name) : "?";
  const activityCount = adventures.length || TODAY_SCHEDULE.length;

  const filteredUpdates = activeTag === "All"
    ? PARENT_UPDATES
    : PARENT_UPDATES.filter((u) => u.tag === activeTag);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 12, paddingBottom: bottomInset + 90 }]}
      refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.hiRow}>
          <Text style={[styles.hiStatic, { color: colors.foreground }]}>Hi </Text>
          <Text style={[styles.hiName, { color: colors.primary }]}>{firstName}!</Text>
        </View>
        <TouchableOpacity
          style={[styles.avatarBtn, { backgroundColor: avatarColor }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (currentLearner) router.push(`/profile/${currentLearner.id}`);
          }}
        >
          <Text style={styles.avatarBtnText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Hero Card ──────────────────────────────────── */}
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroNum}>{activityCount}</Text>
          <Text style={styles.heroSub}>Activities today</Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/adventures");
            }}
          >
            <Text style={styles.heroBtnText}>Parent's Hub</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroRight}>
          <Text style={styles.heroMascot}>🐙</Text>
          <View style={styles.heroBubble1} />
          <View style={styles.heroBubble2} />
        </View>
      </View>

      {/* ─── 6-Icon Category Grid (2 rows × 3) ─────────── */}
      <View style={styles.catGrid}>
        {PARENT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={styles.catCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (cat.route) router.push(cat.route as any);
            }}
            activeOpacity={0.85}
          >
            <View style={[styles.catCardIll, { backgroundColor: cat.illBg }]}>
              {cat.label === "Adventures" ? (
                <Image source={ADVENTURE_ICON} style={styles.catCardImg} resizeMode="contain" />
              ) : cat.label === "Rewards" ? (
                <Image source={REWARDS_ICON} style={styles.catCardImg} resizeMode="contain" />
              ) : (
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
              )}
            </View>
            <View style={styles.catCardLabel}>
              <Text style={[styles.catCardText, { color: colors.foreground }]}>{cat.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Today's Schedule ───────────────────────────── */}
      <View style={styles.scheduleSection}>
        <View style={styles.scheduleTitleRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Schedule</Text>
          <TouchableOpacity>
            <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.scheduleList}>
          {TODAY_SCHEDULE.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.scheduleItem, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={styles.scheduleIconWrap}>
                <Text style={styles.scheduleIcon}>{item.icon}</Text>
              </View>
              <View style={styles.scheduleText}>
                <Text style={styles.scheduleTitle}>{item.title}</Text>
                <View style={styles.scheduleTimeRow}>
                  <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.scheduleTime}>{item.time}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─── Updates Feed ───────────────────────────────── */}
      <View style={styles.updatesSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Updates</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ paddingRight: 4 }}
        >
          {(["All", "Mood", "Schedule", "Lessons"] as UpdateTag[]).map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeTag === tag ? colors.primary : "transparent",
                  borderColor: activeTag === tag ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { Haptics.selectionAsync(); setActiveTag(tag); }}
            >
              <Text style={[styles.filterChipText, { color: activeTag === tag ? "#fff" : colors.mutedForeground }]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredUpdates.map((upd) => (
          <View key={upd.id} style={[styles.updateCard, { backgroundColor: colors.card }]}>
            <View style={[styles.updateBanner, { backgroundColor: upd.color }]}>
              <Text style={styles.updateBannerEmoji}>{upd.emoji}</Text>
              <View style={[styles.updateTagBadge, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[styles.updateTagText, { color: colors.primary }]}>{upd.tag}</Text>
              </View>
            </View>
            <View style={styles.updateBody}>
              <Text style={[styles.updateTitle, { color: colors.foreground }]}>{upd.title}</Text>
              <Text style={[styles.updateDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
                {upd.body}
              </Text>
              <View style={styles.updateFooter}>
                <Text style={[styles.updateAuthor, { color: colors.mutedForeground }]}>By {upd.author}</Text>
                <View style={[styles.updateBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.updateBadgeText, { color: colors.mutedForeground }]}>{upd.badge}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 22 },

  /* Header */
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hiRow: { flexDirection: "row", alignItems: "baseline" },
  hiStatic: { fontSize: 30, fontWeight: "400" },
  hiName: { fontSize: 30, fontWeight: "800" },
  avatarBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  /* Hero */
  heroCard: { borderRadius: 24, padding: 24, flexDirection: "row", alignItems: "center", overflow: "hidden", minHeight: 150 },
  heroLeft: { flex: 1, gap: 6 },
  heroNum: { fontSize: 56, fontWeight: "900", color: "#fff", lineHeight: 60 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.85)" },
  heroBtn: { marginTop: 8, backgroundColor: "#fff", alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  heroBtnText: { fontSize: 14, fontWeight: "700", color: "#2F80ED" },
  heroRight: { alignItems: "center", justifyContent: "center", width: 110, position: "relative" },
  heroMascot: { fontSize: 70, textAlign: "center" },
  heroBubble1: { position: "absolute", width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", top: -10, right: 0 },
  heroBubble2: { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", bottom: 0, left: 5 },

  /* 6-tile grid — matches TeacherHome card layout */
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catCard: {
    width: "30.5%",
    borderRadius: 18,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  catCardIll: {
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 78,
  },
  catCardImg: { width: 52, height: 44 },
  catEmoji: { fontSize: 26 },
  catCardLabel: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  catCardText: { fontSize: 11, fontWeight: "700", textAlign: "center" },

  /* Schedule */
  scheduleSection: { gap: 12 },
  scheduleTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 22, fontWeight: "800" },
  viewAll: { fontSize: 14, fontWeight: "600" },
  scheduleList: { gap: 10 },
  scheduleItem: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, gap: 12 },
  scheduleIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  scheduleIcon: { fontSize: 22 },
  scheduleText: { flex: 1, gap: 4 },
  scheduleTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  scheduleTimeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  scheduleTime: { fontSize: 12, color: "rgba(255,255,255,0.8)" },

  /* Updates */
  updatesSection: { gap: 14 },
  filterRow: { marginHorizontal: -4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginHorizontal: 4 },
  filterChipText: { fontSize: 14, fontWeight: "600" },
  updateCard: { borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  updateBanner: { height: 110, alignItems: "center", justifyContent: "center", position: "relative" },
  updateBannerEmoji: { fontSize: 50 },
  updateTagBadge: { position: "absolute", top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  updateTagText: { fontSize: 11, fontWeight: "700" },
  updateBody: { padding: 16, gap: 6 },
  updateTitle: { fontSize: 16, fontWeight: "800" },
  updateDesc: { fontSize: 13, lineHeight: 20 },
  updateFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  updateAuthor: { fontSize: 12 },
  updateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  updateBadgeText: { fontSize: 11, fontWeight: "600" },
});
