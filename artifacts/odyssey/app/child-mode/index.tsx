import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useApp, Adventure, apiBase } from "@/contexts/AppContext";

export default function ChildModeHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner } = useApp();
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (currentLearner) {
      fetch(`${apiBase()}/adventures/learner/${currentLearner.id}`)
        .then((r) => r.json())
        .then((data) => setAdventures(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [currentLearner]);

  const renderAdventure = ({ item }: { item: Adventure }) => {
    const total = (item.steps?.length ?? 0) * item.coinsPerStep + item.completionBonus;
    return (
      <TouchableOpacity
        style={styles.adventureCard}
        activeOpacity={0.85}
        onPress={() => router.push(`/child-mode/${item.id}`)}
      >
        <View style={styles.cardImageArea}>
          <Image
            source={require("@/assets/images/octopus.png")}
            style={styles.cardOctopus}
            contentFit="contain"
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
          <View style={styles.cardMeta}>
            <View style={styles.coinRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.coinText}>{total} coins</Text>
            </View>
            <Text style={styles.stepsText}>{item.steps?.length ?? 0} steps</Text>
          </View>
        </View>
        <View style={styles.cardArrow}>
          <Ionicons name="play-circle" size={38} color="#2F80ED" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={["#B8E4F9", "#D6F0FF", "#EAF6FF"]}
      style={[styles.container, { paddingTop: topInset, paddingBottom: bottomInset }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Image
          source={require("@/assets/images/octopus.png")}
          style={styles.headerOctopus}
          contentFit="contain"
        />
      </View>

      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>
          Hi {currentLearner?.name ?? "there"}!
        </Text>
        <Text style={styles.greetingSub}>
          These are your adventures today:
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2F80ED" style={{ marginTop: 40 }} />
      ) : adventures.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No adventures yet!</Text>
          <Text style={styles.emptySub}>Ask your teacher to create one.</Text>
        </View>
      ) : (
        <FlatList
          data={adventures}
          renderItem={renderAdventure}
          keyExtractor={(a) => String(a.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerOctopus: { width: 70, height: 70 },
  greetingContainer: { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 24 },
  greeting: {
    fontSize: 36,
    fontWeight: "900",
    color: "#1E3A5F",
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontSize: 18,
    color: "#3B6CA8",
    marginTop: 4,
    fontWeight: "600",
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  adventureCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    shadowColor: "#3B6CA8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  cardImageArea: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#EBF5FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardOctopus: { width: 60, height: 60 },
  cardBody: { flex: 1, paddingHorizontal: 14, gap: 6 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#1E3A5F", lineHeight: 24 },
  cardDesc: { fontSize: 13, color: "#6B93C0", lineHeight: 18 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
  coinRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  coinText: { fontSize: 15, fontWeight: "700", color: "#F59E0B" },
  stepsText: { fontSize: 13, color: "#6B93C0", fontWeight: "600" },
  cardArrow: { paddingLeft: 4 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { fontSize: 22, fontWeight: "800", color: "#1E3A5F" },
  emptySub: { fontSize: 16, color: "#3B6CA8" },
});
