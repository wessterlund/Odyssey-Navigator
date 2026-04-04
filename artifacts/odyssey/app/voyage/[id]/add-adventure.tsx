import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

interface VoyagePath {
  id: number;
  learnerId: number;
  title: string;
  adventureIds: number[];
}

export default function AddAdventureToVoyage() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { adventures } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [voyage, setVoyage] = useState<VoyagePath | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVoyage = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase()}/voyage-paths/${id}`);
      if (res.ok) {
        const data = await res.json();
        setVoyage(data);
        setSelected(new Set(data.adventures?.map((a: any) => a.id) ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadVoyage(); }, [loadVoyage]);

  const toggle = (adventureId: number) => {
    Haptics.selectionAsync();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(adventureId)) next.delete(adventureId);
      else next.add(adventureId);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase()}/voyage-paths/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adventureIds: Array.from(selected) }),
      });
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        Alert.alert("Error", "Could not update voyage path. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Could not update voyage path. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topInset + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add Adventures</Text>
          {voyage && (
            <Text style={styles.headerSub} numberOfLines={1}>{voyage.title}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.doneBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 40 }]}>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Select the adventures to include in this voyage path.
          </Text>

          {adventures.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="map-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No adventures yet. Create adventures from the Adventures tab.
              </Text>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/adventure/create")}
              >
                <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>
                  Create Adventure
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            adventures.map((adventure) => {
              const isSelected = selected.has(adventure.id);
              return (
                <TouchableOpacity
                  key={adventure.id}
                  style={[
                    styles.adventureCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => toggle(adventure.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      {
                        backgroundColor: isSelected ? colors.primary : "transparent",
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={styles.adventureInfo}>
                    <Text style={[styles.adventureTitle, { color: colors.foreground }]}>
                      {adventure.title}
                    </Text>
                    {adventure.description && (
                      <Text style={[styles.adventureDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {adventure.description}
                      </Text>
                    )}
                    <Text style={[styles.adventureMeta, { color: colors.mutedForeground }]}>
                      {adventure.steps?.length ?? 0} steps · {adventure.coinsPerStep} coins/step
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
  },
  doneBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12 },
  hint: { fontSize: 13, lineHeight: 20, marginBottom: 4 },
  emptyCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  createBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  createBtnText: { fontSize: 14, fontWeight: "700" },
  adventureCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  adventureInfo: { flex: 1, gap: 3 },
  adventureTitle: { fontSize: 15, fontWeight: "700" },
  adventureDesc: { fontSize: 13 },
  adventureMeta: { fontSize: 12, marginTop: 2 },
});
