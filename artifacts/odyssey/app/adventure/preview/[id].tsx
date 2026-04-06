import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { apiBase } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const SCREEN_W = Dimensions.get("window").width;

const PROMPT_LEVEL_COLORS: Record<string, string> = {
  "Full Physical": "#EF4444",
  "Partial Physical": "#F97316",
  "Gestural": "#EAB308",
  "Verbal": "#3B82F6",
  "Independent": "#22C55E",
};

function parsePromptLevel(tip: string) {
  const match = tip.match(/^\[Prompt:\s*([^\]]+)\]\s*(.*)/s);
  if (match) return { promptLevel: match[1].trim(), tipText: match[2].trim() };
  return { promptLevel: null, tipText: tip };
}

interface Step {
  id: number;
  instruction: string;
  tip?: string;
  mediaUrl?: string;
  mediaType?: string;
  order: number;
}

interface Adventure {
  id: number;
  title: string;
  description?: string;
  coinsPerStep: number;
  completionBonus: number;
  isDraft?: boolean;
  isPublished?: boolean;
  steps: Step[];
}

export default function AdventurePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase()}/adventures/${id}`);
        if (res.ok) setAdventure(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!adventure) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Text style={[s.notFound, { color: colors.mutedForeground }]}>Adventure not found</Text>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentStep !== null) {
    const step = adventure.steps[currentStep];
    const parsed = step.tip ? parsePromptLevel(step.tip) : { promptLevel: null, tipText: "" };
    const isLast = currentStep === adventure.steps.length - 1;

    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {/* Preview banner */}
        <View style={[s.previewBanner, { paddingTop: topInset + 4 }]}>
          <Ionicons name="eye-outline" size={14} color="#fff" />
          <Text style={s.previewBannerText}>Student Preview Mode — not saved</Text>
          <TouchableOpacity onPress={() => setCurrentStep(null)}>
            <Ionicons name="grid-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: bottomInset + 80 }}>
          {/* Step header */}
          <View style={[s.stepHeaderCard, { backgroundColor: colors.primary }]}>
            <View style={s.stepHeaderRow}>
              <Text style={s.stepHeaderLabel}>Step {currentStep + 1} of {adventure.steps.length}</Text>
              <View style={s.coinPillSmall}>
                <Ionicons name="star" size={12} color="#FFC107" />
                <Text style={s.coinPillSmallText}>+{adventure.coinsPerStep} 🪙</Text>
              </View>
            </View>
            <View style={s.stepProgressBar}>
              <View style={[s.stepProgressFill, { width: `${((currentStep + 1) / adventure.steps.length) * 100}%`, backgroundColor: "rgba(255,255,255,0.4)" }]} />
            </View>
          </View>

          {/* Media */}
          {step.mediaUrl && (
            <View style={s.mediaContainer}>
              {step.mediaType === "video" ? (
                <View style={[s.mediaPlaceholder, { backgroundColor: colors.card }]}>
                  <Ionicons name="videocam" size={48} color={colors.mutedForeground} />
                  <Text style={[s.mediaPlaceholderText, { color: colors.mutedForeground }]}>Video</Text>
                </View>
              ) : (
                <Image source={{ uri: step.mediaUrl }} style={s.mediaImage} contentFit="cover" />
              )}
            </View>
          )}

          {/* Instruction */}
          <View style={[s.instructionCard, { backgroundColor: colors.card }]}>
            <Text style={[s.instructionText, { color: colors.foreground }]}>{step.instruction}</Text>
          </View>

          {/* Prompt badge (teacher note) */}
          {parsed.promptLevel && (
            <View style={s.teacherNote}>
              <View style={[s.teacherNoteHeader, { backgroundColor: `${PROMPT_LEVEL_COLORS[parsed.promptLevel] ?? "#6B7280"}18` }]}>
                <View style={[s.teacherDot, { backgroundColor: PROMPT_LEVEL_COLORS[parsed.promptLevel] ?? "#6B7280" }]} />
                <Text style={[s.teacherNoteLevel, { color: PROMPT_LEVEL_COLORS[parsed.promptLevel] ?? "#6B7280" }]}>
                  Teacher Note: {parsed.promptLevel} Prompt
                </Text>
              </View>
              {parsed.tipText ? (
                <Text style={[s.teacherNoteTip, { color: colors.mutedForeground }]}>{parsed.tipText}</Text>
              ) : null}
            </View>
          )}
        </ScrollView>

        {/* Step nav */}
        <View style={[s.stepNavBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomInset + 8 }]}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[s.navBtnOutline, { borderColor: colors.border }]}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Ionicons name="arrow-back" size={18} color={colors.foreground} />
              <Text style={[s.navBtnOutlineText, { color: colors.foreground }]}>Back</Text>
            </TouchableOpacity>
          )}
          {!isLast ? (
            <TouchableOpacity
              style={[s.navBtnFill, { backgroundColor: colors.primary, flex: currentStep > 0 ? 1.5 : undefined, width: currentStep === 0 ? "100%" : undefined }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCurrentStep(currentStep + 1);
              }}
            >
              <Text style={[s.navBtnFillText, { color: colors.primaryForeground }]}>Next Step</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.navBtnFill, { backgroundColor: "#10B981", flex: currentStep > 0 ? 1.5 : undefined, width: currentStep === 0 ? "100%" : undefined }]}
              onPress={() => setCurrentStep(null)}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={[s.navBtnFillText, { color: "#fff" }]}>Finish Preview</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBack}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {adventure.title}
          </Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Student Preview</Text>
        </View>
        {adventure.isDraft && !adventure.isPublished && (
          <View style={[s.draftBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[s.draftBadgeText, { color: colors.mutedForeground }]}>Draft</Text>
          </View>
        )}
      </View>

      {/* Preview banner */}
      <View style={s.previewBannerOuter}>
        <Ionicons name="eye-outline" size={13} color="#6B7280" />
        <Text style={s.previewBannerOuterText}>
          This is how the student will see this adventure
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 80, gap: 14, paddingTop: 12 }}>
        {/* Adventure hero card */}
        <View style={[s.heroCard, { backgroundColor: colors.primary }]}>
          <Text style={s.heroTitle}>{adventure.title}</Text>
          {adventure.description ? (
            <Text style={s.heroDesc}>{adventure.description}</Text>
          ) : null}
          <View style={s.heroMeta}>
            <View style={s.heroPill}>
              <Ionicons name="footsteps-outline" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={s.heroPillText}>{adventure.steps.length} steps</Text>
            </View>
            <View style={s.heroPill}>
              <Ionicons name="star" size={13} color="#FFC107" />
              <Text style={s.heroPillText}>
                {adventure.steps.length * adventure.coinsPerStep + adventure.completionBonus} coins to earn
              </Text>
            </View>
          </View>
        </View>

        {/* Steps overview */}
        <Text style={[s.stepsLabel, { color: colors.foreground }]}>Steps</Text>
        {adventure.steps.map((step, idx) => {
          const parsed = step.tip ? parsePromptLevel(step.tip) : { promptLevel: null, tipText: "" };
          return (
            <TouchableOpacity
              key={step.id}
              style={[s.stepCard, { backgroundColor: colors.card }]}
              onPress={() => setCurrentStep(idx)}
            >
              <View style={[s.stepBullet, { backgroundColor: colors.primary }]}>
                <Text style={s.stepBulletText}>{idx + 1}</Text>
              </View>
              <View style={s.stepCardContent}>
                <Text style={[s.stepInstruction, { color: colors.foreground }]} numberOfLines={2}>
                  {step.instruction}
                </Text>
                <View style={s.stepCardMeta}>
                  {step.mediaUrl && (
                    <View style={[s.mediaBadge, { backgroundColor: colors.secondary }]}>
                      <Ionicons name={step.mediaType === "video" ? "videocam-outline" : "image-outline"} size={12} color={colors.primary} />
                      <Text style={[s.mediaBadgeText, { color: colors.primary }]}>{step.mediaType ?? "media"}</Text>
                    </View>
                  )}
                  {parsed.promptLevel && (
                    <View style={[s.promptBadge, { backgroundColor: `${PROMPT_LEVEL_COLORS[parsed.promptLevel] ?? "#6B7280"}22`, borderColor: PROMPT_LEVEL_COLORS[parsed.promptLevel] ?? "#6B7280" }]}>
                      <Text style={[s.promptBadgeText, { color: PROMPT_LEVEL_COLORS[parsed.promptLevel] ?? "#6B7280" }]}>{parsed.promptLevel}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={[s.stepCoin, { backgroundColor: "#FEF9C3" }]}>
                <Text style={[s.stepCoinText, { color: "#CA8A04" }]}>+{adventure.coinsPerStep}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Completion bonus */}
        <View style={[s.bonusCard, { backgroundColor: "#10B98115", borderColor: "#10B98130" }]}>
          <Ionicons name="trophy" size={18} color="#10B981" />
          <Text style={[s.bonusText, { color: "#10B981" }]}>
            Completion bonus: +{adventure.completionBonus} coins
          </Text>
        </View>
      </ScrollView>

      {/* Bottom: start preview + publish */}
      <View style={[s.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomInset + 8 }]}>
        <TouchableOpacity
          style={[s.bottomBtnOutline, { borderColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentStep(0);
          }}
        >
          <Ionicons name="play-outline" size={17} color={colors.primary} />
          <Text style={[s.bottomBtnOutlineText, { color: colors.primary }]}>Start Preview</Text>
        </TouchableOpacity>
        {adventure.isDraft && !adventure.isPublished && (
          <TouchableOpacity
            style={[s.bottomBtnFill, { backgroundColor: colors.primary }]}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await fetch(`${apiBase()}/adventures/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDraft: false, isPublished: true }),
              });
              router.replace(`/adventure/${id}`);
            }}
          >
            <Ionicons name="rocket-outline" size={17} color={colors.primaryForeground} />
            <Text style={[s.bottomBtnFillText, { color: colors.primaryForeground }]}>Publish Adventure</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  notFound: { fontSize: 15 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  previewBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#8B5CF6", paddingHorizontal: 16, paddingBottom: 8 },
  previewBannerText: { flex: 1, color: "#fff", fontSize: 12, fontWeight: "600", textAlign: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerBack: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  draftBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  draftBadgeText: { fontSize: 11, fontWeight: "700" },
  previewBannerOuter: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#F3F4F6" },
  previewBannerOuterText: { fontSize: 12, color: "#6B7280" },
  heroCard: { borderRadius: 16, padding: 20, gap: 10 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroDesc: { fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 20 },
  heroMeta: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  heroPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroPillText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  stepsLabel: { fontSize: 17, fontWeight: "700" },
  stepCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 14 },
  stepBullet: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepBulletText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  stepCardContent: { flex: 1, gap: 6 },
  stepInstruction: { fontSize: 14, lineHeight: 20 },
  stepCardMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  mediaBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  mediaBadgeText: { fontSize: 11, fontWeight: "600" },
  promptBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  promptBadgeText: { fontSize: 10, fontWeight: "700" },
  stepCoin: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start" },
  stepCoinText: { fontSize: 12, fontWeight: "700" },
  bonusCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  bonusText: { fontSize: 14, fontWeight: "600" },
  bottomBar: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  bottomBtnOutline: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  bottomBtnOutlineText: { fontSize: 14, fontWeight: "700" },
  bottomBtnFill: { flex: 1.4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14 },
  bottomBtnFillText: { fontSize: 14, fontWeight: "700" },
  stepHeaderCard: { padding: 16, gap: 8 },
  stepHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepHeaderLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  coinPillSmall: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  coinPillSmallText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  stepProgressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 2 },
  stepProgressFill: { height: "100%", borderRadius: 2 },
  mediaContainer: { height: 220 },
  mediaImage: { width: "100%", height: "100%" },
  mediaPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: 8 },
  mediaPlaceholderText: { fontSize: 13 },
  instructionCard: { margin: 16, borderRadius: 16, padding: 20 },
  instructionText: { fontSize: 20, fontWeight: "700", lineHeight: 28, textAlign: "center" },
  teacherNote: { marginHorizontal: 16, borderRadius: 12, overflow: "hidden" },
  teacherNoteHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  teacherDot: { width: 8, height: 8, borderRadius: 4 },
  teacherNoteLevel: { fontSize: 12, fontWeight: "700" },
  teacherNoteTip: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, lineHeight: 18 },
  stepNavBar: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  navBtnOutline: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  navBtnOutlineText: { fontSize: 14, fontWeight: "700" },
  navBtnFill: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, paddingHorizontal: 20 },
  navBtnFillText: { fontSize: 14, fontWeight: "700" },
});
