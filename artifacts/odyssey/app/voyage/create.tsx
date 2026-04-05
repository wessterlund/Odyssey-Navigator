import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, Adventure, Reward } from "@/contexts/AppContext";
import { apiBase } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const TOTAL_STEPS = 5;

interface IEPGoal {
  id: string;
  domain: string;
  shortTitle: string;
  behavior: string;
  condition: string;
  criterion: string;
  interventions: string[];
  dataCollection: string;
  generalization: string[];
}

interface IEPData {
  missionTitle: string;
  missionDescription: string;
  priorityMap: { tier1: string[]; tier2: string[]; tier3: string[] };
  goals: IEPGoal[];
  behaviorPlan?: {
    targetBehavior: string;
    antecedents: string[];
    functions: string[];
    replacementBehaviors: string[];
    preventionStrategies: string[];
    reinforcementStrategies: string[];
  };
  atRecommendations?: { tool: string; purpose: string; implementation: string }[];
  generatedAt: string;
}

interface WizardState {
  title: string;
  description: string;
  adventureIds: number[];
  rewardIds: number[];
  startDate: string;
  endDate: string;
  frequency: "daily" | "weekly";
  visibility: "public" | "private";
  commentsEnabled: boolean;
  iepData: IEPData | null;
}

const defaultState: WizardState = {
  title: "",
  description: "",
  adventureIds: [],
  rewardIds: [],
  startDate: "",
  endDate: "",
  frequency: "daily",
  visibility: "private",
  commentsEnabled: true,
  iepData: null,
};

export default function VoyagePathCreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, adventures, rewards, refreshAll } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(defaultState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local adventure list — includes newly generated IEP adventures
  const [localAdventures, setLocalAdventures] = useState<Adventure[]>(adventures);
  useEffect(() => {
    setLocalAdventures((prev) => {
      const existingIds = new Set(adventures.map((a) => a.id));
      const newlyGenerated = prev.filter((a) => !existingIds.has(a.id));
      return [...adventures, ...newlyGenerated];
    });
  }, [adventures]);

  const onAdventureGenerated = (adv: Adventure) => {
    setLocalAdventures((prev) => {
      if (prev.some((a) => a.id === adv.id)) return prev;
      return [...prev, adv];
    });
    setState((prev) => ({
      ...prev,
      adventureIds: prev.adventureIds.includes(adv.id)
        ? prev.adventureIds
        : [...prev.adventureIds, adv.id],
    }));
  };

  const update = (partial: Partial<WizardState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const toggleAdventure = (id: number) => {
    setState((prev) => ({
      ...prev,
      adventureIds: prev.adventureIds.includes(id)
        ? prev.adventureIds.filter((x) => x !== id)
        : [...prev.adventureIds, id],
    }));
  };

  const toggleReward = (id: number) => {
    setState((prev) => ({
      ...prev,
      rewardIds: prev.rewardIds.includes(id)
        ? prev.rewardIds.filter((x) => x !== id)
        : [...prev.rewardIds, id],
    }));
  };

  const canNext = () => {
    if (step === 1) return state.title.trim().length > 0;
    return true;
  };

  const save = async (status: "draft" | "active") => {
    if (!currentLearner) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/voyage-paths`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: currentLearner.id,
          title: state.title,
          description: state.description || null,
          adventureIds: state.adventureIds,
          rewardIds: state.rewardIds,
          startDate: state.startDate || null,
          endDate: state.endDate || null,
          frequency: state.frequency,
          visibility: state.visibility,
          commentsEnabled: state.commentsEnabled,
          iepData: state.iepData || null,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to save voyage path");
      const vp = await res.json();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/voyage/${vp.id}`);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1Mission
            state={state}
            update={update}
            colors={colors}
            currentLearner={currentLearner}
          />
        );
      case 2:
        return (
          <Step2Adventures
            state={state}
            adventures={localAdventures}
            toggleAdventure={toggleAdventure}
            colors={colors}
            onCreateNew={() => router.push("/adventure/create")}
            currentLearner={currentLearner}
            onAdventureGenerated={onAdventureGenerated}
          />
        );
      case 3:
        return (
          <Step3Rewards
            state={state}
            rewards={rewards}
            toggleReward={toggleReward}
            colors={colors}
            onCreateNew={() => router.push("/reward/create")}
          />
        );
      case 4:
        return <Step4Schedule state={state} update={update} colors={colors} />;
      case 5:
        return (
          <Step5Review
            state={state}
            adventures={adventures}
            rewards={rewards}
            colors={colors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {step === 1 ? "Explorer's Mission" :
             step === 2 ? "Treasure Islands" :
             step === 3 ? "Rewards" :
             step === 4 ? "Schedule" :
             "Review & Save"}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Step {step} of {TOTAL_STEPS}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: `${(step / TOTAL_STEPS) * 100}%` as any },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: "#FEF2F2" }]}>
            <Text style={[styles.errorText, { color: "#DC2626" }]}>{error}</Text>
          </View>
        )}
        {renderStep()}
      </ScrollView>

      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.background,
            paddingBottom: bottomInset + 16,
            borderTopColor: colors.border,
          },
        ]}
      >
        {step < TOTAL_STEPS ? (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              { backgroundColor: canNext() ? colors.primary : colors.border },
            ]}
            disabled={!canNext() || saving}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep(step + 1);
            }}
          >
            <Text style={[styles.nextBtnText, { color: canNext() ? colors.primaryForeground : colors.mutedForeground }]}>
              Next
            </Text>
            <Ionicons name="chevron-forward" size={20} color={canNext() ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.finalBtns}>
            <TouchableOpacity
              style={[styles.draftBtn, { borderColor: colors.border }]}
              disabled={saving}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                save("draft");
              }}
            >
              {saving ? <ActivityIndicator size="small" color={colors.mutedForeground} /> :
                <Text style={[styles.draftBtnText, { color: colors.foreground }]}>Save Draft</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.publishBtn, { backgroundColor: colors.primary }]}
              disabled={saving}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                save("active");
              }}
            >
              {saving ? <ActivityIndicator size="small" color={colors.primaryForeground} /> :
                <Text style={[styles.publishBtnText, { color: colors.primaryForeground }]}>Publish</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Step 1: Mission ──────────────────────────────────────────────────────────
function Step1Mission({ state, update, colors, currentLearner }: any) {
  const [aiMode, setAiMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [commLevel, setCommLevel] = useState("verbal");
  const [environment, setEnvironment] = useState("school and home");
  const [priorityBehaviors, setPriorityBehaviors] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const COMM_LEVELS = [
    { value: "verbal", label: "Verbal" },
    { value: "limited verbal", label: "Limited Verbal" },
    { value: "AAC device", label: "AAC Device" },
    { value: "non-verbal", label: "Non-Verbal" },
  ];

  const ENVIRONMENTS = [
    { value: "school", label: "School" },
    { value: "home", label: "Home" },
    { value: "school and home", label: "Both" },
    { value: "community", label: "Community" },
  ];

  const generateIEP = async () => {
    if (!currentLearner) return;
    setGenerating(true);
    setAiError(null);
    try {
      const res = await fetch(`${apiBase()}/ai/generate-iep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: currentLearner.id,
          communicationLevel: commLevel,
          environment,
          priorityBehaviors: priorityBehaviors.trim() || undefined,
          additionalContext: additionalContext.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Generation failed. Please try again.");
      const iep = await res.json();
      update({
        iepData: iep,
        title: iep.missionTitle || state.title,
        description: iep.missionDescription || state.description,
      });
      setShowPreview(true);
    } catch (e: any) {
      setAiError(e.message ?? "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const prompts = [
    "Help the learner practice daily self-care routines independently.",
    "Build communication skills through structured social activities.",
    "Develop emotional regulation strategies through guided play.",
    "Improve focus and attention during structured learning sessions.",
  ];

  return (
    <View style={styles.stepContent}>
      {/* AI IEP Toggle */}
      <View style={[styles.aiToggleCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
        <View style={styles.aiToggleLeft}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.aiToggleTitle, { color: colors.foreground }]}>AI IEP Generator</Text>
            <Text style={[styles.aiToggleSub, { color: colors.mutedForeground }]}>
              Generate a clinical IEP plan using {currentLearner?.name || "the learner"}'s profile
            </Text>
          </View>
        </View>
        <Switch
          value={aiMode}
          onValueChange={(v) => {
            setAiMode(v);
            setShowPreview(false);
            setAiError(null);
            if (!v) update({ iepData: null });
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      {aiMode && (
        <View style={[styles.aiPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.aiPanelTitle, { color: colors.foreground }]}>Learner Context</Text>
          <Text style={[styles.aiPanelSub, { color: colors.mutedForeground }]}>
            Review and adjust — the AI will use {currentLearner?.name || "the learner"}'s profile plus these details.
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Communication Level</Text>
          <View style={styles.chipRow}>
            {COMM_LEVELS.map((cl) => (
              <TouchableOpacity
                key={cl.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: commLevel === cl.value ? colors.primary : colors.background,
                    borderColor: commLevel === cl.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCommLevel(cl.value)}
              >
                <Text style={[styles.chipText, { color: commLevel === cl.value ? colors.primaryForeground : colors.foreground }]}>
                  {cl.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Environment</Text>
          <View style={styles.chipRow}>
            {ENVIRONMENTS.map((env) => (
              <TouchableOpacity
                key={env.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: environment === env.value ? colors.primary : colors.background,
                    borderColor: environment === env.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setEnvironment(env.value)}
              >
                <Text style={[styles.chipText, { color: environment === env.value ? colors.primaryForeground : colors.foreground }]}>
                  {env.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
            Priority Behaviors to Address
          </Text>
          <TextInput
            style={[styles.aiTextArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. self-injurious behavior, elopement, meltdowns during transitions…"
            placeholderTextColor={colors.mutedForeground}
            value={priorityBehaviors}
            onChangeText={setPriorityBehaviors}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
            Additional Context (optional)
          </Text>
          <TextInput
            style={[styles.aiTextArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Any recent assessments, family priorities, classroom setting details…"
            placeholderTextColor={colors.mutedForeground}
            value={additionalContext}
            onChangeText={setAdditionalContext}
            multiline
            numberOfLines={3}
          />

          {aiError && (
            <Text style={[styles.aiErrorText, { color: "#DC2626" }]}>{aiError}</Text>
          )}

          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: generating ? colors.border : colors.primary }]}
            disabled={generating}
            onPress={generateIEP}
          >
            {generating ? (
              <View style={styles.generateBtnInner}>
                <ActivityIndicator size="small" color={colors.mutedForeground} />
                <Text style={[styles.generateBtnText, { color: colors.mutedForeground }]}>Generating IEP…</Text>
              </View>
            ) : (
              <View style={styles.generateBtnInner}>
                <Ionicons name="sparkles" size={18} color={colors.primaryForeground} />
                <Text style={[styles.generateBtnText, { color: colors.primaryForeground }]}>
                  {state.iepData ? "Regenerate IEP Plan" : "Generate IEP Plan"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {showPreview && state.iepData && (
            <IEPPreview iepData={state.iepData} colors={colors} />
          )}
        </View>
      )}

      {/* Manual mission fields */}
      <Text style={[styles.stepLabel, { color: colors.mutedForeground, marginTop: aiMode ? 16 : 0 }]}>
        Mission Title *
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        placeholder="Give this voyage path a clear mission title…"
        placeholderTextColor={colors.mutedForeground}
        value={state.title}
        onChangeText={(t) => update({ title: t })}
        maxLength={100}
      />

      <Text style={[styles.stepLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Description</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        placeholder="Describe the goal of this voyage path in detail…"
        placeholderTextColor={colors.mutedForeground}
        value={state.description}
        onChangeText={(t) => update({ description: t })}
        multiline
        numberOfLines={4}
      />

      {!aiMode && (
        <>
          <Text style={[styles.stepLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Suggested Prompts</Text>
          {prompts.map((prompt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.promptChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => update({ description: prompt })}
            >
              <Ionicons name="bulb-outline" size={16} color={colors.primary} />
              <Text style={[styles.promptText, { color: colors.foreground }]} numberOfLines={2}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
}

function IEPPreview({ iepData, colors }: { iepData: IEPData; colors: any }) {
  const DOMAIN_ICONS: Record<string, string> = {
    communication: "chatbubble-ellipses-outline",
    behavior: "warning-outline",
    social: "people-outline",
    adl: "home-outline",
    academic: "book-outline",
    motor: "body-outline",
  };

  const DOMAIN_COLORS: Record<string, string> = {
    communication: "#2F80ED",
    behavior: "#EF4444",
    social: "#8B5CF6",
    adl: "#10B981",
    academic: "#F59E0B",
    motor: "#06B6D4",
  };

  return (
    <View style={[styles.iepPreview, { borderColor: `${colors.primary}30` }]}>
      <View style={styles.iepPreviewHeader}>
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text style={[styles.iepPreviewTitle, { color: "#10B981" }]}>IEP Plan Generated</Text>
      </View>

      {/* Priority Map */}
      <Text style={[styles.iepSectionLabel, { color: colors.mutedForeground }]}>Priority Map</Text>
      {[
        { key: "tier1", label: "Tier 1 — Immediate", color: "#EF4444" },
        { key: "tier2", label: "Tier 2 — Important", color: "#F59E0B" },
        { key: "tier3", label: "Tier 3 — Generalization", color: "#10B981" },
      ].map(({ key, label, color }) => {
        const items = (iepData.priorityMap as any)[key] as string[];
        if (!items?.length) return null;
        return (
          <View key={key} style={[styles.tierCard, { borderLeftColor: color }]}>
            <Text style={[styles.tierLabel, { color }]}>{label}</Text>
            {items.map((item, i) => (
              <Text key={i} style={[styles.tierItem, { color: colors.foreground }]}>• {item}</Text>
            ))}
          </View>
        );
      })}

      {/* Goals summary */}
      <Text style={[styles.iepSectionLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
        IEP Goals ({iepData.goals.length})
      </Text>
      {iepData.goals.map((goal) => {
        const domColor = DOMAIN_COLORS[goal.domain] || colors.primary;
        const domIcon = DOMAIN_ICONS[goal.domain] || "flag-outline";
        return (
          <View key={goal.id} style={[styles.goalPreviewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.goalDomainBadge, { backgroundColor: `${domColor}20` }]}>
              <Ionicons name={domIcon as any} size={12} color={domColor} />
              <Text style={[styles.goalDomainText, { color: domColor }]}>{goal.domain}</Text>
            </View>
            <Text style={[styles.goalPreviewTitle, { color: colors.foreground }]}>{goal.shortTitle}</Text>
            <Text style={[styles.goalPreviewCriterion, { color: colors.mutedForeground }]} numberOfLines={2}>
              {goal.criterion}
            </Text>
          </View>
        );
      })}

      {iepData.behaviorPlan && (
        <View style={[styles.bpBadge, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#EF4444" />
          <Text style={[styles.bpBadgeText, { color: "#DC2626" }]}>Behavior Intervention Plan included</Text>
        </View>
      )}

      {iepData.atRecommendations && iepData.atRecommendations.length > 0 && (
        <View style={[styles.bpBadge, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
          <Ionicons name="hardware-chip-outline" size={14} color="#10B981" />
          <Text style={[styles.bpBadgeText, { color: "#059669" }]}>
            {iepData.atRecommendations.length} Assistive Technology recommendation{iepData.atRecommendations.length > 1 ? "s" : ""} included
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Step 2: Adventures ───────────────────────────────────────────────────────
const DOMAIN_ICONS_WIZ: Record<string, string> = {
  communication: "chatbubble-ellipses-outline",
  behavior: "warning-outline",
  social: "people-outline",
  adl: "home-outline",
  academic: "book-outline",
  motor: "body-outline",
};

const DOMAIN_COLORS_WIZ: Record<string, string> = {
  communication: "#2F80ED",
  behavior: "#EF4444",
  social: "#8B5CF6",
  adl: "#10B981",
  academic: "#F59E0B",
  motor: "#06B6D4",
};

function Step2Adventures({ state, adventures, toggleAdventure, colors, onCreateNew, currentLearner, onAdventureGenerated }: any) {
  const [generatingGoals, setGeneratingGoals] = useState<Record<string, boolean>>({});
  const [generatedGoals, setGeneratedGoals] = useState<Record<string, number>>({}); // goalId → adventureId

  const generateForGoal = async (goal: IEPGoal) => {
    if (!currentLearner || generatingGoals[goal.id]) return;
    setGeneratingGoals((prev) => ({ ...prev, [goal.id]: true }));
    try {
      // Step 1: generate adventure content from AI
      const aiRes = await fetch(`${apiBase()}/ai/generate-adventure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: currentLearner.id,
          goal: `${goal.shortTitle}: ${goal.behavior} (${goal.condition}). Criterion: ${goal.criterion}`,
        }),
      });
      if (!aiRes.ok) throw new Error("AI generation failed");
      const aiAdv = await aiRes.json();

      // Step 2: save the adventure to DB
      const saveRes = await fetch(`${apiBase()}/adventures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: currentLearner.id,
          title: aiAdv.title,
          description: aiAdv.description || null,
          coinsPerStep: aiAdv.coinsPerStep ?? 2,
          completionBonus: aiAdv.completionBonus ?? 5,
          steps: (aiAdv.steps || []).map((s: any) => ({
            instruction: s.instruction,
            tip: s.tip || null,
          })),
        }),
      });
      if (!saveRes.ok) throw new Error("Save failed");
      const saved = await saveRes.json();

      // Reconstruct adventure with steps for local state
      const newAdv = {
        ...saved,
        steps: (aiAdv.steps || []).map((s: any, i: number) => ({
          id: i,
          adventureId: saved.id,
          instruction: s.instruction,
          tip: s.tip || null,
          order: i,
        })),
      };

      setGeneratedGoals((prev) => ({ ...prev, [goal.id]: saved.id }));
      onAdventureGenerated(newAdv);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // fail silently — user can retry
    } finally {
      setGeneratingGoals((prev) => ({ ...prev, [goal.id]: false }));
    }
  };

  const hasIEP = !!state.iepData && state.iepData.goals?.length > 0;

  return (
    <View style={styles.stepContent}>
      {/* IEP Recommended Adventures */}
      {hasIEP && (
        <View style={[styles.iepRecommendBlock, { borderColor: `${colors.primary}30` }]}>
          <View style={styles.iepRecommendHeader}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.iepRecommendTitle, { color: colors.primary }]}>IEP-Recommended Adventures</Text>
          </View>
          <Text style={[styles.iepRecommendSub, { color: colors.mutedForeground }]}>
            Generate a targeted adventure for each IEP goal — it will be created and auto-selected.
          </Text>

          {state.iepData.goals.map((goal: IEPGoal) => {
            const domColor = DOMAIN_COLORS_WIZ[goal.domain] ?? colors.primary;
            const domIcon = DOMAIN_ICONS_WIZ[goal.domain] ?? "flag-outline";
            const isGenerating = generatingGoals[goal.id];
            const generatedAdvId = generatedGoals[goal.id];
            const isGenerated = !!generatedAdvId;
            const isSelected = generatedAdvId && state.adventureIds.includes(generatedAdvId);

            return (
              <View
                key={goal.id}
                style={[
                  styles.iepGoalCard,
                  {
                    backgroundColor: isGenerated ? `${domColor}08` : colors.card,
                    borderColor: isGenerated ? `${domColor}40` : colors.border,
                  },
                ]}
              >
                <View style={styles.iepGoalCardTop}>
                  <View style={[styles.domainPill, { backgroundColor: `${domColor}18` }]}>
                    <Ionicons name={domIcon as any} size={12} color={domColor} />
                    <Text style={[styles.domainPillText, { color: domColor }]}>{goal.domain}</Text>
                  </View>
                  {isGenerated && (
                    <View style={styles.generatedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <Text style={[styles.generatedBadgeText, { color: "#10B981" }]}>Added</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.iepGoalTitle, { color: colors.foreground }]}>{goal.shortTitle}</Text>
                <Text style={[styles.iepGoalDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {goal.behavior}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.generateGoalBtn,
                    {
                      backgroundColor: isGenerated
                        ? `${domColor}15`
                        : isGenerating
                        ? colors.border
                        : domColor,
                    },
                  ]}
                  disabled={isGenerating}
                  onPress={() => generateForGoal(goal)}
                >
                  {isGenerating ? (
                    <View style={styles.generateGoalBtnInner}>
                      <ActivityIndicator size="small" color={colors.mutedForeground} />
                      <Text style={[styles.generateGoalBtnText, { color: colors.mutedForeground }]}>
                        Generating…
                      </Text>
                    </View>
                  ) : isGenerated ? (
                    <View style={styles.generateGoalBtnInner}>
                      <Ionicons name="refresh-outline" size={15} color={domColor} />
                      <Text style={[styles.generateGoalBtnText, { color: domColor }]}>Regenerate</Text>
                    </View>
                  ) : (
                    <View style={styles.generateGoalBtnInner}>
                      <Ionicons name="sparkles" size={15} color="#fff" />
                      <Text style={[styles.generateGoalBtnText, { color: "#fff" }]}>Generate Adventure</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Existing adventures */}
      <Text style={[styles.stepDesc, { color: colors.mutedForeground, marginTop: hasIEP ? 8 : 0 }]}>
        {hasIEP ? "Or select from existing adventures:" : "Select existing adventures to include in this voyage path, or create new ones."}
      </Text>

      {adventures.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="map-outline" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No adventures yet</Text>
        </View>
      ) : (
        adventures.map((adv: Adventure) => {
          const selected = state.adventureIds.includes(adv.id);
          return (
            <TouchableOpacity
              key={adv.id}
              style={[
                styles.selectCard,
                {
                  backgroundColor: selected ? `${colors.primary}18` : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleAdventure(adv.id);
              }}
            >
              <View style={[styles.selectCheck, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : "transparent" }]}>
                {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <View style={styles.selectCardContent}>
                <Text style={[styles.selectCardTitle, { color: colors.foreground }]}>{adv.title}</Text>
                {adv.description && (
                  <Text style={[styles.selectCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {adv.description}
                  </Text>
                )}
                <Text style={[styles.selectCardMeta, { color: colors.mutedForeground }]}>
                  {adv.steps?.length ?? 0} steps
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <TouchableOpacity
        style={[styles.addNewBtn, { borderColor: colors.primary }]}
        onPress={onCreateNew}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={[styles.addNewBtnText, { color: colors.primary }]}>Add new adventure</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 3: Rewards ─────────────────────────────────────────────────────────
function Step3Rewards({ state, rewards, toggleReward, colors, onCreateNew }: any) {
  const published = rewards.filter((r: Reward) => !r.isDraft);
  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
        Select rewards that will motivate the learner to complete this voyage path.
      </Text>

      {published.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="gift-outline" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No rewards yet</Text>
        </View>
      ) : (
        published.map((r: Reward) => {
          const selected = state.rewardIds.includes(r.id);
          return (
            <TouchableOpacity
              key={r.id}
              style={[
                styles.selectCard,
                {
                  backgroundColor: selected ? `${colors.primary}18` : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleReward(r.id);
              }}
            >
              <View style={[styles.selectCheck, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : "transparent" }]}>
                {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <View style={styles.selectCardContent}>
                <Text style={[styles.selectCardTitle, { color: colors.foreground }]}>{r.name}</Text>
                {r.description && (
                  <Text style={[styles.selectCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {r.description}
                  </Text>
                )}
                <Text style={[styles.selectCardMeta, { color: colors.coin }]}>{r.cost} coins</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <TouchableOpacity
        style={[styles.addNewBtn, { borderColor: colors.primary }]}
        onPress={onCreateNew}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={[styles.addNewBtnText, { color: colors.primary }]}>Add new reward</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 4: Schedule ─────────────────────────────────────────────────────────
function Step4Schedule({ state, update, colors }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Start Date</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.mutedForeground}
        value={state.startDate}
        onChangeText={(t) => update({ startDate: t })}
      />

      <Text style={[styles.stepLabel, { color: colors.mutedForeground, marginTop: 16 }]}>End Date</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.mutedForeground}
        value={state.endDate}
        onChangeText={(t) => update({ endDate: t })}
      />

      <Text style={[styles.stepLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Frequency</Text>
      <View style={styles.segmentRow}>
        {(["daily", "weekly"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.segmentBtn,
              {
                backgroundColor: state.frequency === f ? colors.primary : colors.card,
                borderColor: state.frequency === f ? colors.primary : colors.border,
              },
            ]}
            onPress={() => update({ frequency: f })}
          >
            <Text style={{ color: state.frequency === f ? colors.primaryForeground : colors.foreground, fontWeight: "600", textTransform: "capitalize" }}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.stepLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Visibility</Text>
      <View style={styles.segmentRow}>
        {(["private", "public"] as const).map((v) => (
          <TouchableOpacity
            key={v}
            style={[
              styles.segmentBtn,
              {
                backgroundColor: state.visibility === v ? colors.primary : colors.card,
                borderColor: state.visibility === v ? colors.primary : colors.border,
              },
            ]}
            onPress={() => update({ visibility: v })}
          >
            <Ionicons
              name={v === "private" ? "lock-closed-outline" : "globe-outline"}
              size={14}
              color={state.visibility === v ? colors.primaryForeground : colors.foreground}
            />
            <Text style={{ color: state.visibility === v ? colors.primaryForeground : colors.foreground, fontWeight: "600", textTransform: "capitalize" }}>
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.toggleLeft}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.mutedForeground} />
          <View>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Enable Comments</Text>
            <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
              Allow notes and comments on adventures
            </Text>
          </View>
        </View>
        <Switch
          value={state.commentsEnabled}
          onValueChange={(v) => update({ commentsEnabled: v })}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>
    </View>
  );
}

// ─── Step 5: Review ───────────────────────────────────────────────────────────
function Step5Review({ state, adventures, rewards, colors }: any) {
  const selectedAdventures = adventures.filter((a: Adventure) => state.adventureIds.includes(a.id));
  const selectedRewards = rewards.filter((r: Reward) => state.rewardIds.includes(r.id));
  return (
    <View style={styles.stepContent}>
      {state.iepData && (
        <View style={[styles.reviewSection, { backgroundColor: `${colors.primary}08`, borderWidth: 1, borderColor: `${colors.primary}30` }]}>
          <View style={styles.reviewSectionHeaderRow}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>AI IEP Plan</Text>
          </View>
          <Text style={[styles.reviewTitle, { color: colors.foreground }]}>{state.iepData.missionTitle}</Text>
          <Text style={[styles.reviewDesc, { color: colors.mutedForeground }]}>
            {state.iepData.goals.length} goals · {
              (state.iepData.priorityMap.tier1.length + state.iepData.priorityMap.tier2.length + state.iepData.priorityMap.tier3.length)
            } priorities
            {state.iepData.behaviorPlan ? " · BIP included" : ""}
          </Text>
        </View>
      )}

      <View style={[styles.reviewSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.reviewSectionTitle, { color: colors.mutedForeground }]}>Explorer's Mission</Text>
        <Text style={[styles.reviewTitle, { color: colors.foreground }]}>{state.title || "—"}</Text>
        {state.description ? (
          <Text style={[styles.reviewDesc, { color: colors.mutedForeground }]}>{state.description}</Text>
        ) : null}
      </View>

      <View style={[styles.reviewSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.reviewSectionTitle, { color: colors.mutedForeground }]}>
          Adventures ({selectedAdventures.length})
        </Text>
        {selectedAdventures.length === 0 ? (
          <Text style={[styles.reviewEmpty, { color: colors.mutedForeground }]}>None selected</Text>
        ) : (
          selectedAdventures.map((a: Adventure) => (
            <View key={a.id} style={styles.reviewItem}>
              <Ionicons name="map" size={16} color={colors.primary} />
              <Text style={[styles.reviewItemText, { color: colors.foreground }]}>{a.title}</Text>
            </View>
          ))
        )}
      </View>

      <View style={[styles.reviewSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.reviewSectionTitle, { color: colors.mutedForeground }]}>
          Rewards ({selectedRewards.length})
        </Text>
        {selectedRewards.length === 0 ? (
          <Text style={[styles.reviewEmpty, { color: colors.mutedForeground }]}>None selected</Text>
        ) : (
          selectedRewards.map((r: Reward) => (
            <View key={r.id} style={styles.reviewItem}>
              <Ionicons name="gift" size={16} color={colors.coin} />
              <Text style={[styles.reviewItemText, { color: colors.foreground }]}>{r.name}</Text>
            </View>
          ))
        )}
      </View>

      <View style={[styles.reviewSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.reviewSectionTitle, { color: colors.mutedForeground }]}>Schedule</Text>
        <View style={styles.reviewItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.reviewItemText, { color: colors.foreground }]}>
            {state.startDate || "No start date"} → {state.endDate || "No end date"}
          </Text>
        </View>
        <View style={styles.reviewItem}>
          <Ionicons name="refresh-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.reviewItemText, { color: colors.foreground, textTransform: "capitalize" }]}>
            {state.frequency}
          </Text>
        </View>
        <View style={styles.reviewItem}>
          <Ionicons name={state.visibility === "private" ? "lock-closed-outline" : "globe-outline"} size={16} color={colors.mutedForeground} />
          <Text style={[styles.reviewItemText, { color: colors.foreground, textTransform: "capitalize" }]}>
            {state.visibility}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 2 },
  progressTrack: { height: 3, width: "100%" },
  progressFill: { height: 3 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  errorBanner: { borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 14 },
  stepContent: { gap: 0 },
  stepLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  stepDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 4,
  },
  promptChip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  promptText: { fontSize: 14, flex: 1, lineHeight: 20 },
  bottomNav: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: { fontSize: 16, fontWeight: "700" },
  finalBtns: { flexDirection: "row", gap: 12 },
  draftBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  draftBtnText: { fontSize: 16, fontWeight: "600" },
  publishBtn: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  publishBtnText: { fontSize: 16, fontWeight: "700" },
  selectCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  selectCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  selectCardContent: { flex: 1 },
  selectCardTitle: { fontSize: 15, fontWeight: "600" },
  selectCardSub: { fontSize: 13, marginTop: 2 },
  selectCardMeta: { fontSize: 12, marginTop: 4 },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 4,
  },
  addNewBtnText: { fontSize: 15, fontWeight: "600" },
  emptyCard: {
    alignItems: "center",
    gap: 10,
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  emptyText: { fontSize: 14 },
  segmentRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: "600" },
  toggleSub: { fontSize: 12, marginTop: 2 },
  reviewSection: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  reviewSectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  reviewSectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  reviewTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  reviewDesc: { fontSize: 14, lineHeight: 20 },
  reviewItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  reviewItemText: { fontSize: 14, flex: 1 },
  reviewEmpty: { fontSize: 14 },
  // IEP recommendation block (Step 2)
  iepRecommendBlock: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  iepRecommendHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  iepRecommendTitle: { fontSize: 15, fontWeight: "800" },
  iepRecommendSub: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  iepGoalCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  iepGoalCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  domainPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  domainPillText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  generatedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  generatedBadgeText: { fontSize: 12, fontWeight: "700" },
  iepGoalTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  iepGoalDesc: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  generateGoalBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  generateGoalBtnInner: { flexDirection: "row", alignItems: "center", gap: 7 },
  generateGoalBtnText: { fontSize: 14, fontWeight: "700" },
  // AI IEP styles
  aiToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  aiToggleLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  aiToggleTitle: { fontSize: 15, fontWeight: "700" },
  aiToggleSub: { fontSize: 12, marginTop: 2 },
  aiPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  aiPanelTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  aiPanelSub: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  aiTextArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  aiErrorText: { fontSize: 13, marginTop: 8 },
  generateBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  generateBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  generateBtnText: { fontSize: 15, fontWeight: "700" },
  iepPreview: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    backgroundColor: "transparent",
  },
  iepPreviewHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  iepPreviewTitle: { fontSize: 15, fontWeight: "700" },
  iepSectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  tierCard: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  tierLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  tierItem: { fontSize: 13, lineHeight: 18, marginBottom: 2 },
  goalPreviewCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  goalDomainBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  goalDomainText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  goalPreviewTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  goalPreviewCriterion: { fontSize: 12, lineHeight: 16 },
  bpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  bpBadgeText: { fontSize: 13, fontWeight: "600" },
});
