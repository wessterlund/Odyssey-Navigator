import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { CoinBadge } from "@/components/CoinBadge";
import * as Haptics from "expo-haptics";

export default function AdventuresScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, adventures, loading, loadAdventures } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (currentLearner) loadAdventures(currentLearner.id);
  }, [currentLearner?.id]);

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
      <View style={[styles.headerBar, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Adventures</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/adventure/create");
          }}
        >
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={adventures}
        keyExtractor={(item) => String(item.id)}
        style={styles.flatList}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomInset + 90 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadAdventures(currentLearner.id)}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <TouchableOpacity
            style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/adventure/create")}
          >
            <Ionicons name="sparkles" size={40} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No Adventures Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Create your first AI-powered adventure for {currentLearner.name}
            </Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/adventure/${item.id}`);
            }}
          >
            <View style={[styles.cardIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="map" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
              {item.description && (
                <Text
                  style={[styles.cardDesc, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              )}
              <View style={styles.cardMeta}>
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {item.steps?.length ?? 0} steps
                </Text>
                <CoinBadge amount={item.coinsPerStep} size="sm" />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  flatList: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: "700" },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingTop: 4, gap: 10 },
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
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyText: { fontSize: 15, fontWeight: "500" },
  card: {
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
  cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardContent: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  metaText: { fontSize: 12 },
});
