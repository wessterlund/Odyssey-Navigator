import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase, Learner } from "@/contexts/AppContext";
import { CoinBadge } from "@/components/CoinBadge";
import * as Haptics from "expo-haptics";

interface VoyagePath {
  id: number;
  title: string;
  status: "draft" | "active" | "completed";
  adventureIds: number[];
  frequency?: string;
}

interface PerformanceStat {
  adventureId: number;
  adventureTitle: string;
  completionRate: number;
  totalSessions: number;
  lastSession?: string;
}

const AVATAR_COLORS = [
  "#2F80ED","#8B5CF6","#EC4899","#F59E0B","#10B981","#EF4444","#06B6D4","#F97316",
];

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function calcAge(birthday: string) {
  if (!birthday) return null;
  const today = new Date();
  const bday = new Date(birthday);
  let age = today.getFullYear() - bday.getFullYear();
  const m = today.getMonth() - bday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
  return age;
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[tagStyles.wrap, { backgroundColor: bg }]}>
      <Text style={[tagStyles.text, { color }]}>{label}</Text>
    </View>
  );
}
const tagStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  text: { fontSize: 12, fontWeight: "600" },
});

export default function LearnerProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { learners, adventures, wallet, setCurrentLearner, refreshAll } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [learner, setLearner] = useState<Learner | null>(null);
  const [voyagePaths, setVoyagePaths] = useState<VoyagePath[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const found = learners.find((l) => String(l.id) === id);
    if (found) setLearner(found);
  }, [learners, id]);

  const loadVoyages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${apiBase()}/voyage-paths/learner/${id}`);
      if (res.ok) setVoyagePaths(await res.json());
    } catch {}
  }, [id]);

  useEffect(() => {
    loadVoyages();
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (id) await refreshAll(Number(id));
    await loadVoyages();
    setRefreshing(false);
  }, [id, refreshAll, loadVoyages]);

  const activePath = voyagePaths.find((vp) => vp.status === "active") ?? voyagePaths[0] ?? null;
  const avatarColor = learner ? getAvatarColor(learner.id) : "#2F80ED";
  const initials = learner ? getInitials(learner.name) : "?";
  const age = learner ? calcAge(learner.birthday) : null;

  const handleDelete = () => {
    Alert.alert(
      "Delete Learner Profile",
      `Are you sure you want to delete ${learner?.name}'s profile? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await fetch(`${apiBase()}/learners/${id}`, { method: "DELETE" });
              setCurrentLearner(null);
              router.back();
            } catch {
              Alert.alert("Error", "Could not delete learner. Please try again.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!learner) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Blue Header Banner */}
      <View style={[styles.banner, { backgroundColor: colors.primary, paddingTop: topInset + 12 }]}>
        <View style={styles.bannerNav}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push(`/profile/${id}/edit` as any)}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Name and info */}
        <Text style={styles.bannerName}>{learner.name}</Text>
        {age !== null && (
          <Text style={styles.bannerAge}>{age} years old</Text>
        )}
        {learner.diagnosis && (
          <View style={styles.diagnosisTag}>
            <Text style={styles.diagnosisText}>{learner.diagnosis}</Text>
          </View>
        )}

        {/* Quick meta */}
        <View style={styles.bannerMeta}>
          {learner.school && (
            <View style={styles.bannerMetaItem}>
              <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.bannerMetaText}>{learner.school}</Text>
            </View>
          )}
          {learner.class && (
            <View style={styles.bannerMetaItem}>
              <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.bannerMetaText}>{learner.class}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.body}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="map" size={20} color={colors.primary} />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{adventures.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Adventures</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="star" size={20} color={colors.coin} />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{wallet?.lifetimeCoins ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Coins Earned</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="compass" size={20} color="#10B981" />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{voyagePaths.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Voyage Paths</Text>
          </View>
        </View>

        {/* Voyage Path CTA */}
        <TouchableOpacity
          style={[
            styles.voyageCta,
            {
              backgroundColor: activePath ? colors.primary : colors.card,
              borderColor: activePath ? colors.primary : colors.border,
              borderWidth: activePath ? 0 : 1,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (activePath) {
              router.push(`/voyage/${activePath.id}`);
            } else {
              setCurrentLearner(learner);
              router.push("/voyage/create");
            }
          }}
        >
          <View style={styles.voyageCtaLeft}>
            <Ionicons
              name={activePath ? "compass" : "add-circle-outline"}
              size={24}
              color={activePath ? "#fff" : colors.primary}
            />
            <View style={styles.voyageCtaInfo}>
              <Text
                style={[
                  styles.voyageCtaLabel,
                  { color: activePath ? "rgba(255,255,255,0.75)" : colors.mutedForeground },
                ]}
              >
                Voyage Path
              </Text>
              <Text
                style={[
                  styles.voyageCtaTitle,
                  { color: activePath ? "#fff" : colors.foreground },
                ]}
                numberOfLines={1}
              >
                {activePath ? activePath.title : "Create Voyage Path"}
              </Text>
              {activePath && (
                <Text style={[styles.voyageCtaMeta, { color: "rgba(255,255,255,0.75)" }]}>
                  {activePath.status.charAt(0).toUpperCase() + activePath.status.slice(1)} ·{" "}
                  {activePath.adventureIds?.length ?? 0} adventures
                </Text>
              )}
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={activePath ? "rgba(255,255,255,0.8)" : colors.mutedForeground}
          />
        </TouchableOpacity>

        {/* View Progress Button */}
        <TouchableOpacity
          style={[styles.progressBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push(`/profile/${id}/progress` as any)}
        >
          <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
          <Text style={[styles.progressBtnText, { color: colors.foreground }]}>View Progress & Analytics</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Therapies */}
        {learner.therapies && learner.therapies.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Therapies</Text>
            <View style={styles.tagWrap}>
              {learner.therapies.map((t) => (
                <Tag key={t} label={t} color={colors.primary} bg={colors.primary + "18"} />
              ))}
            </View>
          </View>
        )}

        {/* Interests */}
        {learner.interests && learner.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Interests</Text>
            <View style={styles.tagWrap}>
              {learner.interests.map((t) => (
                <Tag key={t} label={t} color="#8B5CF6" bg="#8B5CF618" />
              ))}
            </View>
          </View>
        )}

        {/* Capabilities */}
        {learner.capabilities && learner.capabilities.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Capabilities</Text>
            <View style={styles.tagWrap}>
              {learner.capabilities.map((t) => (
                <Tag key={t} label={t} color="#10B981" bg="#10B98118" />
              ))}
            </View>
          </View>
        )}

        {/* Challenges */}
        {learner.challenges && learner.challenges.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Challenges</Text>
            <View style={styles.tagWrap}>
              {learner.challenges.map((t) => (
                <Tag key={t} label={t} color="#EF4444" bg="#EF444418" />
              ))}
            </View>
          </View>
        )}

        {/* Learning Goals */}
        {learner.learningGoals && learner.learningGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Learning Goals</Text>
            <View style={[styles.goalsList, { backgroundColor: colors.card }]}>
              {learner.learningGoals.map((goal, i) => (
                <View
                  key={i}
                  style={[
                    styles.goalItem,
                    i < learner.learningGoals!.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.goalDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.goalText, { color: colors.foreground }]}>{goal}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Long-term Goals */}
        {learner.longTermGoals && learner.longTermGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Long-Term Goals</Text>
            <View style={[styles.goalsList, { backgroundColor: colors.card }]}>
              {learner.longTermGoals.map((goal, i) => (
                <View
                  key={i}
                  style={[
                    styles.goalItem,
                    i < learner.longTermGoals!.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.goalDot, { backgroundColor: "#F59E0B" }]} />
                  <Text style={[styles.goalText, { color: colors.foreground }]}>{goal}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Adventures */}
        {adventures.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Adventures</Text>
            {adventures.slice(0, 5).map((adventure) => (
              <TouchableOpacity
                key={adventure.id}
                style={[styles.adventureCard, { backgroundColor: colors.card }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/adventure/${adventure.id}`);
                }}
              >
                <View style={[styles.adventureIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Ionicons name="map-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.adventureInfo}>
                  <Text style={[styles.adventureTitle, { color: colors.foreground }]}>
                    {adventure.title}
                  </Text>
                  <Text style={[styles.adventureMeta, { color: colors.mutedForeground }]}>
                    {adventure.steps?.length ?? 0} steps · {adventure.coinsPerStep} coins/step
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Danger Zone */}
        <View style={[styles.dangerSection, { borderColor: "#EF444430" }]}>
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: "#EF4444" }]}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={[styles.deleteBtnText, { color: "#EF4444" }]}>
              {deleting ? "Deleting..." : "Delete Learner Profile"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  banner: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: "center",
  },
  bannerNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: { marginBottom: 12 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText: { fontSize: 30, fontWeight: "800", color: "#fff" },
  bannerName: { fontSize: 24, fontWeight: "800", color: "#fff", textAlign: "center" },
  bannerAge: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  diagnosisTag: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  diagnosisText: { fontSize: 13, color: "#fff", fontWeight: "600" },
  bannerMeta: { flexDirection: "row", gap: 16, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  bannerMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  bannerMetaText: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  body: { padding: 16, gap: 20 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statNum: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, fontWeight: "500", textAlign: "center" },
  voyageCta: {
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  voyageCtaLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  voyageCtaInfo: { flex: 1, gap: 2 },
  voyageCtaLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  voyageCtaTitle: { fontSize: 16, fontWeight: "800" },
  voyageCtaMeta: { fontSize: 12, marginTop: 2 },
  progressBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  progressBtnText: { flex: 1, fontSize: 15, fontWeight: "600" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  tagWrap: { flexDirection: "row", flexWrap: "wrap" },
  goalsList: { borderRadius: 14, overflow: "hidden" },
  goalItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  goalDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  goalText: { flex: 1, fontSize: 14, lineHeight: 20 },
  adventureCard: {
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  adventureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  adventureInfo: { flex: 1, gap: 3 },
  adventureTitle: { fontSize: 14, fontWeight: "700" },
  adventureMeta: { fontSize: 12 },
  dangerSection: { borderWidth: 1, borderRadius: 14, padding: 14 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "700" },
});
