import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

type NookTag = "All" | "Announcements" | "Posts" | "Resources";

const NOOK_TAGS: NookTag[] = ["All", "Announcements", "Posts", "Resources"];

const ARTICLE = {
  title: "How to implement Floortime Therapy",
  body: "Floortime therapy is a relationship-based play therapy approach, often used with children with autism",
};

const STUDENTS_GRID = [
  { id: 1, label: "Classes",    sub: "View all", blobColor: "#C7D9F8", figureColor: "#5B8AF0", emoji: "📚", route: "/teacher-hub/classes" },
  { id: 2, label: "Students",   sub: "View all", blobColor: "#C7D9F8", figureColor: "#E07B6E", emoji: "🎓", route: "/teacher-hub/students" },
  { id: 3, label: "Adventures", sub: "View all", blobColor: "#C7D9F8", figureColor: "#5B8AF0", emoji: "🗺️", route: "/(tabs)/adventures" },
  { id: 4, label: "Rewards",    sub: "View all", blobColor: "#F5D5C8", figureColor: "#E07B6E", emoji: "🎁", route: "/(tabs)/rewards" },
];

const PARENTS_GRID = [
  { id: 1, label: "Parents",  sub: "View all", blobColor: "#C7D9F8", figureColor: "#5B8AF0", emoji: "👨‍👩‍👧", route: "/teacher-hub/parents" },
  { id: 2, label: "Lessons",  sub: "View all", blobColor: "#D4C7F5", figureColor: "#9B7FE0", emoji: "📖", route: "/teacher-hub/announcements" },
];

/* ─── Blob card component ─────────────────────────────── */
function BlobCard({
  item,
  onPress,
}: {
  item: (typeof STUDENTS_GRID)[0] & { route?: string };
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.gridCard} activeOpacity={0.8} onPress={onPress}>
      {/* Blob illustration area */}
      <View style={styles.blobWrap}>
        <View style={[styles.blob, { backgroundColor: item.blobColor }]}>
          <Text style={styles.blobEmoji}>{item.emoji}</Text>
        </View>
      </View>
      <Text style={styles.gridLabel}>{item.label}</Text>
      <Text style={styles.gridSub}>{item.sub}</Text>
    </TouchableOpacity>
  );
}

export default function TeacherHubScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTag, setActiveTag] = useState<NookTag>("All");

  const topInset = Platform.OS === "web" ? 67 : insets.top + 12;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ─── Header ─────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topInset }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Teacher's Hub</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── My Nook ──────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: "#2F80ED" }]}>My Nook</Text>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {NOOK_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.chip,
                activeTag === tag
                  ? { backgroundColor: "#2F80ED", borderColor: "#2F80ED" }
                  : { backgroundColor: "transparent", borderColor: "#D1D5DB" },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTag(tag);
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: activeTag === tag ? "#fff" : colors.foreground },
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Article card */}
        <View style={[styles.articleCard, { backgroundColor: colors.card }]}>
          {/* Illustrated banner */}
          <View style={styles.articleBanner}>
            {/* Room scene illustration */}
            <View style={styles.roomBg}>
              {/* Desk + monitor */}
              <View style={styles.monitor} />
              <View style={styles.desk} />
              {/* Floating colored squares */}
              <View style={[styles.square, { backgroundColor: "#E85C5C", top: 18, left: 28 }]} />
              <View style={[styles.square, { backgroundColor: "#F5A623", top: 8, left: 52, width: 14, height: 14 }]} />
              <View style={[styles.square, { backgroundColor: "#4CAF50", top: 32, left: 46, width: 10, height: 10 }]} />
              <View style={[styles.square, { backgroundColor: "#2196F3", top: 14, left: 80, width: 16, height: 16 }]} />
              {/* Shelves on right */}
              <View style={styles.shelf}>
                <View style={[styles.shelfBook, { backgroundColor: "#E85C5C" }]} />
                <View style={[styles.shelfBook, { backgroundColor: "#4CAF50" }]} />
                <View style={[styles.shelfBook, { backgroundColor: "#F5A623" }]} />
              </View>
              {/* Person at desk */}
              <View style={styles.personWrap}>
                <Text style={styles.personEmoji}>👩‍💻</Text>
              </View>
            </View>
          </View>
          {/* Text body */}
          <View style={styles.articleBody}>
            <Text style={[styles.articleTitle, { color: colors.foreground }]}>{ARTICLE.title}</Text>
            <Text style={[styles.articleDesc, { color: colors.mutedForeground }]}>{ARTICLE.body}</Text>
          </View>
        </View>

        {/* ─── Students ─────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: "#2F80ED" }]}>Students</Text>
        <View style={styles.grid}>
          {STUDENTS_GRID.map((item) => (
            <BlobCard
              key={item.id}
              item={item}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.route) router.push(item.route as any);
              }}
            />
          ))}
        </View>

        {/* ─── Parents ──────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: "#2F80ED" }]}>Parents</Text>
        <View style={styles.grid}>
          {PARENTS_GRID.map((item) => (
            <BlobCard
              key={item.id}
              item={item}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.route) router.push(item.route as any);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700" },
  headerSpacer: { width: 36 },

  /* Section titles */
  sectionTitle: { fontSize: 22, fontWeight: "800", marginTop: 6 },

  /* Filter chips */
  chipRow: { gap: 10, paddingRight: 4 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontWeight: "600" },

  /* Article card */
  articleCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  articleBanner: {
    height: 160,
    backgroundColor: "#A8C8F0",
    overflow: "hidden",
    position: "relative",
  },
  roomBg: {
    flex: 1,
    backgroundColor: "#8BB8E8",
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  monitor: {
    position: "absolute",
    width: 60,
    height: 44,
    backgroundColor: "#5A8FC0",
    borderRadius: 6,
    top: 50,
    left: "38%",
  },
  desk: {
    position: "absolute",
    width: 120,
    height: 14,
    backgroundColor: "#4A7FAB",
    borderRadius: 4,
    bottom: 40,
    left: "28%",
  },
  square: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 3,
  },
  shelf: {
    position: "absolute",
    right: 20,
    top: 20,
    width: 50,
    flexDirection: "row",
    gap: 4,
    alignItems: "flex-end",
  },
  shelfBook: { width: 12, borderRadius: 2, height: 36 },
  personWrap: { position: "absolute", bottom: 24, left: "35%" },
  personEmoji: { fontSize: 52 },
  articleBody: { padding: 16, gap: 6 },
  articleTitle: { fontSize: 16, fontWeight: "800", lineHeight: 22 },
  articleDesc: { fontSize: 13, lineHeight: 19 },

  /* Grid */
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  gridCard: {
    flex: 1,
    minWidth: "44%",
    maxWidth: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: 8,
  },
  blobWrap: { alignItems: "flex-start" },
  blob: {
    width: 80,
    height: 68,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderTopRightRadius: 56,
    borderBottomLeftRadius: 28,
    borderTopLeftRadius: 52,
    borderBottomRightRadius: 36,
  },
  blobEmoji: { fontSize: 32 },
  gridLabel: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  gridSub: { fontSize: 13, color: "#9CA3AF" },
});
