import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
  Animated,
  Image,
} from "react-native";

import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const ADVENTURE_ICON   = require("@/assets/images/adventure-icon.png");
const OCTOPUS_MASCOT   = require("@/assets/images/octopus-mascot.png");

const { width: SCREEN_W } = Dimensions.get("window");

const OCEAN_BG = "#C8E8F8";
const OCEAN_CARD = "#FFFFFF";
const OCEAN_BLUE = "#2F80ED";
const OCEAN_BUBBLE = "rgba(255,255,255,0.55)";

const CATEGORY_COLORS: Record<string, string> = {
  "Daily living": "#3B82F6",
  "Socialising": "#8B5CF6",
  "Learning": "#10B981",
  "Communication": "#F59E0B",
  "Motor Skills": "#EC4899",
  "Self Care": "#06B6D4",
};

const ADVENTURE_EMOJIS = ["🦷", "🍽️", "🤝", "📚", "🏃", "🎨", "🧩", "🛁", "👗", "🎯"];
const BG_PLACEHOLDERS = ["#DBEAFE", "#EDE9FE", "#D1FAE5", "#FEF3C7", "#FCE7F3", "#CFFAFE"];

function getCategory(adventure: any, idx: number): string {
  const cats = Object.keys(CATEGORY_COLORS);
  return cats[idx % cats.length];
}

function getTimeLabel(idx: number): string | null {
  const times = [null, "1:30 PM", "2:00 PM", "3:00 PM", "4:30 PM", "5:00 PM"];
  return times[idx] ?? `${5 + idx}:00 PM`;
}

/** Decorative bubble circle */
function Bubble({ x, y, size, opacity }: { x: number; y: number; size: number; opacity: number }) {
  return (
    <View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: OCEAN_BUBBLE,
        opacity,
      }}
      pointerEvents="none"
    />
  );
}

export default function StudentHome({ topPadding }: { topPadding?: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, adventures, wallet, loading, refreshAll, loadLearners } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  const topInset = topPadding ?? (Platform.OS === "web" ? 20 : insets.top + 12);
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLearners();
    if (currentLearner) await refreshAll(currentLearner.id);
    setRefreshing(false);
  }, [currentLearner, loadLearners, refreshAll]);

  const firstName = currentLearner?.name.split(" ")[0] ?? "there";
  const coins = wallet?.coins ?? 0;

  return (
    <View style={styles.root}>
      {/* ── Full-bleed ocean background ──────────────── */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: OCEAN_BG }]} />
        {/* Decorative bubbles — static positions */}
        <Bubble x={-30} y={80}  size={120} opacity={0.6} />
        <Bubble x={SCREEN_W - 60} y={40}  size={90}  opacity={0.5} />
        <Bubble x={20}  y={300} size={60}  opacity={0.4} />
        <Bubble x={SCREEN_W - 40} y={260} size={50}  opacity={0.5} />
        <Bubble x={60}  y={500} size={80}  opacity={0.35} />
        <Bubble x={SCREEN_W - 80} y={520} size={70}  opacity={0.4} />
        <Bubble x={10}  y={720} size={50}  opacity={0.3} />
        <Bubble x={SCREEN_W - 30} y={750} size={45}  opacity={0.35} />
        <Bubble x={140} y={900} size={65}  opacity={0.3} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 8, paddingBottom: bottomInset + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} tintColor={OCEAN_BLUE} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hi <Text style={styles.greetingName}>{firstName}!</Text>
          </Text>
          <View style={styles.headerRight}>
            {/* Coin badge */}
            <View style={styles.coinBadge}>
              <Text style={styles.coinCount}>{coins}</Text>
              <Text style={styles.coinEmoji}>🪙</Text>
            </View>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🧒</Text>
            </View>
          </View>
        </View>

        {/* ── Mascot speech bubble card ────────────── */}
        <View style={styles.mascotCard}>
          <Image source={OCTOPUS_MASCOT} style={styles.mascotImg} resizeMode="contain" />
          <View style={styles.speechBubble}>
            <View style={styles.speechTail} />
            <Text style={styles.speechText}>These are your adventures today!</Text>
          </View>
        </View>

        {/* ── Adventure Timeline ───────────────────── */}
        <View style={styles.timeline}>
          {adventures.length === 0 && !loading && (
            <View style={styles.emptyTimeline}>
              <Text style={styles.emptyEmoji}>🌊</Text>
              <Text style={styles.emptyText}>No adventures yet today!</Text>
              <Text style={styles.emptySubText}>Your teacher will add adventures soon.</Text>
            </View>
          )}

          {adventures.map((adventure, idx) => {
            const isCompleted = idx === 0 && !!adventure.lastCompletedAt;
            const timeLabel = getTimeLabel(idx);
            const category = getCategory(adventure, idx);
            const catColor = CATEGORY_COLORS[category] ?? OCEAN_BLUE;
            const emoji = ADVENTURE_EMOJIS[idx % ADVENTURE_EMOJIS.length];
            const placeholderBg = BG_PLACEHOLDERS[idx % BG_PLACEHOLDERS.length];

            return (
              <View key={adventure.id} style={styles.timelineRow}>
                {/* Left: time marker / checkmark */}
                <View style={styles.timelineLeft}>
                  {isCompleted ? (
                    <View style={[styles.checkCircle, { backgroundColor: OCEAN_BLUE }]}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  ) : (
                    <View style={[styles.timePill, { backgroundColor: OCEAN_BLUE }]}>
                      <Text style={styles.timePillText}>{timeLabel}</Text>
                    </View>
                  )}
                  {/* Vertical connector line */}
                  {idx < adventures.length - 1 && (
                    <View style={[styles.timelineConnector, { backgroundColor: isCompleted ? OCEAN_BLUE : "rgba(47,128,237,0.25)" }]} />
                  )}
                </View>

                {/* Right: adventure card */}
                <TouchableOpacity
                  style={[styles.adventureCard, isCompleted && { opacity: 0.75 }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/adventure/${adventure.id}` as any);
                  }}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardText}>
                      <Text style={[styles.cardCategory, { color: catColor }]}>{category}</Text>
                      <Text style={styles.cardTitle} numberOfLines={2}>{adventure.title}</Text>
                      <View style={styles.cardCoins}>
                        <Text style={styles.coinIconSmall}>🪙</Text>
                        <Text style={styles.cardCoinText}>{adventure.coinsPerStep ?? 25}</Text>
                      </View>
                    </View>
                    {/* Image thumbnail */}
                    <View style={[styles.cardThumb, { backgroundColor: placeholderBg }]}>
                      {adventure.steps?.[0]?.mediaUrl ? (
                        <View style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
                      ) : (
                        <Image source={ADVENTURE_ICON} style={styles.cardThumbImg} resizeMode="contain" />
                      )}
                    </View>
                  </View>
                  {isCompleted && (
                    <View style={[styles.completedBanner, { backgroundColor: OCEAN_BLUE + "18" }]}>
                      <Ionicons name="checkmark-circle" size={13} color={OCEAN_BLUE} />
                      <Text style={[styles.completedText, { color: OCEAN_BLUE }]}>Completed!</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const CARD_H = 100;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  /* Header */
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  greeting: { fontSize: 30, fontWeight: "400", color: "#1E3A5F" },
  greetingName: { fontSize: 30, fontWeight: "900", color: "#1E3A5F" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
  },
  coinCount: { fontSize: 15, fontWeight: "800", color: "#92400E" },
  coinEmoji: { fontSize: 16 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarEmoji: { fontSize: 26 },

  /* Mascot */
  mascotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  mascotEmoji: { fontSize: 52 },
  mascotImg: { width: 80, height: 80 },
  speechBubble: {
    flex: 1,
    backgroundColor: OCEAN_CARD,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  speechTail: {
    position: "absolute",
    left: -10,
    top: "50%",
    marginTop: -6,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 10,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: OCEAN_CARD,
  },
  speechText: { fontSize: 15, fontWeight: "700", color: "#1E3A5F", lineHeight: 22 },

  /* Timeline */
  timeline: { gap: 0 },
  timelineRow: { flexDirection: "row", gap: 14, minHeight: CARD_H + 18 },
  timelineLeft: { width: 68, alignItems: "center", paddingTop: 10 },
  checkCircle: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  timePill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, alignItems: "center" },
  timePillText: { fontSize: 10, fontWeight: "800", color: "#fff", textAlign: "center" },
  timelineConnector: { flex: 1, width: 2, marginTop: 6, marginBottom: 0 },

  adventureCard: {
    flex: 1,
    backgroundColor: OCEAN_CARD,
    borderRadius: 20,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardContent: { flexDirection: "row", padding: 14, gap: 10, minHeight: CARD_H },
  cardText: { flex: 1, justifyContent: "center", gap: 4 },
  cardCategory: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { fontSize: 20, fontWeight: "900", color: "#1E3A5F", lineHeight: 24 },
  cardCoins: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  coinIconSmall: { fontSize: 14 },
  cardCoinText: { fontSize: 14, fontWeight: "700", color: "#92400E" },
  cardThumb: {
    width: 90,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  cardThumbEmoji: { fontSize: 40 },
  cardThumbImg: { width: 80, height: 68 },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(47,128,237,0.12)",
  },
  completedText: { fontSize: 12, fontWeight: "700" },

  /* Empty */
  emptyTimeline: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { fontSize: 20, fontWeight: "700", color: "#1E3A5F" },
  emptySubText: { fontSize: 14, color: "#5A8BAD", textAlign: "center" },
});
