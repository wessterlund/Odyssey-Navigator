import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W } = Dimensions.get("window");
const H_PAD = 20;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_W - H_PAD * 2 - CARD_GAP) / 2;


type CommunityTemplate = {
  id: number;
  name: string;
  description: string;
  author: string;
  steps: number;
};

function SectionHeader({
  title,
  onViewAll,
  colors,
}: {
  title: string;
  onViewAll?: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function AdventureCard({
  adventure,
  colors,
  onPress,
}: {
  adventure: { id: number; title: string; steps?: { id: number }[] };
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const stepCount = adventure.steps?.length ?? 0;

  return (
    <TouchableOpacity
      style={[styles.advCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.advCardImage}>
        <Ionicons name="map" size={32} color={colors.primary} />
      </View>
      <View style={styles.advCardBody}>
        <Text style={[styles.advCardName, { color: colors.foreground }]} numberOfLines={2}>
          {adventure.title}
        </Text>
        <View style={styles.advStepRow}>
          <View style={styles.advStepBadge}>
            <Ionicons name="footsteps-outline" size={12} color={colors.primary} />
          </View>
          <Text style={[styles.advStepCount, { color: colors.foreground }]}>{stepCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function PhotoCard({
  name,
  subtitle,
  imageUrl,
  colors,
  onPress,
}: {
  name: string;
  subtitle: string;
  imageUrl?: string | null;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.photoCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.photoCardImage} contentFit="cover" />
      ) : (
        <View style={[styles.photoCardImage, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name="map-outline" size={32} color={colors.primary} />
        </View>
      )}
      <View style={styles.photoCardBody}>
        <Text style={[styles.photoCardName, { color: colors.foreground }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.photoCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdventuresScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, adventures, loading, loadAdventures } = useApp();

  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (currentLearner) loadAdventures(currentLearner.id);
    loadTemplates();
  }, [currentLearner?.id]);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await fetch(`${apiBase()}/adventures/community-templates`);
      if (res.ok) setTemplates(await res.json());
    } catch {
    } finally {
      setTemplatesLoading(false);
    }
  };

  const onRefresh = () => {
    if (currentLearner) loadAdventures(currentLearner.id);
    loadTemplates();
  };

  const myAdventures = adventures.filter((a) => !a.isTemplate);
  const draftAdventures = myAdventures.filter((a) => a.isDraft === true && !a.isPublished);
  const activeAdventures = myAdventures.filter((a) => a.isPublished === true);

  if (!currentLearner) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="map-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Select a learner first
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Adventures</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={loading || templatesLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Adventures Section */}
        <SectionHeader
          title="Adventures"
          onViewAll={() => {}}
          colors={colors}
        />

        {activeAdventures.length === 0 ? (
          <View style={[styles.emptySection, { borderColor: colors.border }]}>
            <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
              No adventures yet — create one below!
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {activeAdventures.map((adv) => (
              <AdventureCard
                key={adv.id}
                adventure={adv}
                colors={colors}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/adventure/${adv.id}`);
                }}
              />
            ))}
          </View>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Drafts Section */}
        <SectionHeader
          title="Drafts"
          onViewAll={() => {}}
          colors={colors}
        />

        {draftAdventures.length === 0 ? (
          <View style={[styles.emptySection, { borderColor: colors.border }]}>
            <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
              No drafts — all adventures are complete!
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {draftAdventures.map((adv) => (
              <PhotoCard
                key={adv.id}
                name={adv.title}
                subtitle="Continue"
                imageUrl={(adv as any).imageUrl ?? null}
                colors={colors}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/adventure/${adv.id}`);
                }}
              />
            ))}
          </View>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Community Templates Section */}
        <SectionHeader
          title="Community templates"
          onViewAll={() => {}}
          colors={colors}
        />

        {templates.length === 0 ? (
          <View style={[styles.emptySection, { borderColor: colors.border }]}>
            <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
              Loading templates…
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {templates.slice(0, 4).map((t) => (
              <PhotoCard
                key={t.id}
                name={t.name}
                subtitle={`By ${t.author}`}
                imageUrl={null}
                colors={colors}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add new adventure */}
      <View style={[styles.addBarContainer, { paddingBottom: bottomInset + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.addBar, { backgroundColor: colors.primary }]}
          activeOpacity={0.88}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/adventure/create");
          }}
        >
          <Text style={styles.addBarText}>Add new adventure</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    justifyContent: "space-between",
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    gap: 0,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  viewAll: { fontSize: 14, fontWeight: "500" },

  divider: { height: 1, marginVertical: 20 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
    marginBottom: 4,
  },

  /* Adventure card — mirrors rewards card layout, blue palette */
  advCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  advCardImage: {
    width: "100%",
    height: 110,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  advCardBody: { padding: 10, gap: 4 },
  advCardName: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  advStepRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  advStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  advStepCount: { fontSize: 14, fontWeight: "700" },

  /* Photo card (drafts / templates) */
  photoCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  photoCardImage: { width: "100%", height: 110 },
  photoCardBody: { padding: 10, gap: 2 },
  photoCardName: { fontSize: 14, fontWeight: "700" },
  photoCardSub: { fontSize: 12 },

  /* Empty state */
  emptySection: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 4,
  },
  emptySectionText: { fontSize: 13, textAlign: "center" },

  /* Add bar */
  addBarContainer: {
    paddingHorizontal: H_PAD,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  addBar: {
    borderRadius: 50,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  addBarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
