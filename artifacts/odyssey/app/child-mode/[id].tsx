import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase, Adventure, Step } from "@/contexts/AppContext";
import { CoinBadge } from "@/components/CoinBadge";
import { ProgressBar } from "@/components/ProgressBar";
import * as Haptics from "expo-haptics";

export default function ChildModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, wallet, refreshAll } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [startTime, setStartTime] = useState(Date.now());

  // AI Co-pilot
  const [copilotTip, setCopilotTip] = useState<string | null>(null);
  const [showCopilot, setShowCopilot] = useState(false);
  const [loadingTip, setLoadingTip] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAdventure();
    return () => { if (tipTimer.current) clearTimeout(tipTimer.current); };
  }, [id]);

  useEffect(() => {
    // Auto-show copilot tip if step takes > 30s or has multiple attempts
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => {
      if (!completed && adventure && currentLearner) {
        fetchCopilotTip();
      }
    }, 30000);
    return () => { if (tipTimer.current) clearTimeout(tipTimer.current); };
  }, [currentStepIndex, attempts]);

  const fetchAdventure = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/adventures/${id}`);
      const data = await res.json();
      setAdventure(data);
      setStartTime(Date.now());
    } catch {
      Alert.alert("Error", "Could not load adventure.");
      router.back();
    }
    setLoading(false);
  };

  const fetchCopilotTip = async () => {
    if (!currentLearner || !adventure) return;
    const currentStep = adventure.steps[currentStepIndex];
    if (!currentStep) return;
    setLoadingTip(true);
    try {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const res = await fetch(`${apiBase()}/ai/copilot-tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: currentLearner.id,
          stepInstruction: currentStep.instruction,
          attempts,
          elapsedSeconds: elapsed,
        }),
      });
      const data = await res.json();
      setCopilotTip(data.tip);
      setShowCopilot(true);
    } catch {}
    setLoadingTip(false);
  };

  const handleHelpPress = () => {
    setAttempts((a) => a + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchCopilotTip();
  };

  const earnCoins = async (amount: number, source: "step" | "completion", note?: string) => {
    if (!currentLearner) return;
    await fetch(`${apiBase()}/wallet/learner/${currentLearner.id}/earn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, source, note }),
    });
  };

  const trackPerformance = async (stepId: number | undefined, success: boolean) => {
    if (!currentLearner || !adventure) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    try {
      await fetch(`${apiBase()}/ai/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: currentLearner.id,
          stepId: stepId ?? null,
          adventureId: adventure.id,
          completionTime: elapsed,
          attempts,
          success,
        }),
      });
    } catch {}
  };

  const handleStepDone = async () => {
    if (!adventure || completing) return;
    const currentStep = adventure.steps[currentStepIndex];

    setCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await earnCoins(adventure.coinsPerStep, "step", `Step ${currentStepIndex + 1}: ${currentStep.instruction.slice(0, 40)}`);
    await trackPerformance(currentStep.id, true);

    setTotalEarned((prev) => prev + adventure.coinsPerStep);

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= adventure.steps.length) {
      // Completion
      await earnCoins(adventure.completionBonus, "completion", `Completed: ${adventure.title}`);
      setTotalEarned((prev) => prev + adventure.completionBonus);
      setCompleted(true);
      if (currentLearner) await refreshAll(currentLearner.id);

      Animated.spring(celebrateAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 5,
      }).start();
    } else {
      setCurrentStepIndex(nextIndex);
      setAttempts(1);
      setStartTime(Date.now());
      setCopilotTip(null);
      setShowCopilot(false);
    }
    setCompleting(false);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!adventure || adventure.steps.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          No steps in this adventure
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (completed) {
    const celebrateScale = celebrateAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 1.2, 1],
    });

    return (
      <View
        style={[
          styles.celebrationContainer,
          { backgroundColor: colors.background, paddingTop: topInset, paddingBottom: bottomInset },
        ]}
      >
        <Animated.View
          style={[styles.celebrationCard, { transform: [{ scale: celebrateScale }] }]}
        >
          <View style={[styles.celebrationIcon, { backgroundColor: colors.coinBg }]}>
            <Ionicons name="trophy" size={64} color={colors.coin} />
          </View>
          <Text style={[styles.celebrationTitle, { color: colors.foreground }]}>
            Amazing Work!
          </Text>
          <Text style={[styles.celebrationSub, { color: colors.mutedForeground }]}>
            {adventure.title} completed!
          </Text>
          <View style={[styles.earnedBadge, { backgroundColor: colors.coinBg }]}>
            <Ionicons name="star" size={28} color={colors.coin} />
            <Text style={[styles.earnedText, { color: colors.coin }]}>+{totalEarned} coins</Text>
          </View>
          {wallet && (
            <Text style={[styles.balanceText, { color: colors.mutedForeground }]}>
              Total: {wallet.coins + totalEarned} coins
            </Text>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = adventure.steps[currentStepIndex];
  const progress = ((currentStepIndex) / adventure.steps.length) * 100;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: topInset, paddingBottom: bottomInset },
      ]}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert("Exit Adventure", "Your progress will be saved. Exit?", [
              { text: "Cancel", style: "cancel" },
              { text: "Exit", onPress: () => router.back() },
            ]);
          }}
        >
          <Ionicons name="close" size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} height={8} />
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            {currentStepIndex + 1} / {adventure.steps.length}
          </Text>
        </View>
        <CoinBadge amount={totalEarned} size="sm" />
      </View>

      <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
        {/* Step Number */}
        <View style={[styles.stepNumBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.stepNumLabel, { color: colors.primary }]}>
            Step {currentStepIndex + 1}
          </Text>
        </View>

        {/* Instruction */}
        <View style={[styles.instructionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.instructionText, { color: colors.foreground }]}>
            {currentStep.instruction}
          </Text>
        </View>

        {/* Tip from teacher */}
        {currentStep.tip && (
          <View style={[styles.teacherTip, { backgroundColor: colors.secondary }]}>
            <Ionicons name="information-circle" size={18} color={colors.primary} />
            <Text style={[styles.teacherTipText, { color: colors.primary }]}>
              {currentStep.tip}
            </Text>
          </View>
        )}

        {/* AI Copilot Tip */}
        {showCopilot && copilotTip && (
          <View style={[styles.copilotBubble, { backgroundColor: "#EFF6FF" }]}>
            <View style={styles.copilotHeader}>
              <Ionicons name="bulb" size={18} color={colors.primary} />
              <Text style={[styles.copilotLabel, { color: colors.primary }]}>AI Tip</Text>
              <TouchableOpacity onPress={() => setShowCopilot(false)} style={styles.copilotClose}>
                <Ionicons name="close" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.copilotText, { color: colors.foreground }]}>{copilotTip}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.helpBtn, { backgroundColor: colors.secondary }]}
          onPress={handleHelpPress}
          disabled={loadingTip}
        >
          {loadingTip ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.doneStepBtn, { backgroundColor: colors.primary, opacity: completing ? 0.7 : 1 }]}
          onPress={handleStepDone}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Ionicons name="checkmark" size={26} color={colors.primaryForeground} />
              <Text style={[styles.doneStepText, { color: colors.primaryForeground }]}>Done</Text>
              <CoinBadge amount={adventure.coinsPerStep} size="sm" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15 },
  backLink: { fontSize: 15, fontWeight: "600" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressContainer: { flex: 1, gap: 4 },
  progressLabel: { fontSize: 11, fontWeight: "500", textAlign: "right" },
  stepContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 20,
    justifyContent: "center",
  },
  stepNumBadge: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stepNumLabel: { fontSize: 14, fontWeight: "700" },
  instructionCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  instructionText: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 32,
  },
  teacherTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 14,
    borderRadius: 14,
  },
  teacherTipText: { flex: 1, fontSize: 14, lineHeight: 20 },
  copilotBubble: {
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  copilotHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  copilotLabel: { fontSize: 13, fontWeight: "700", flex: 1 },
  copilotClose: { padding: 2 },
  copilotText: { fontSize: 14, lineHeight: 20 },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  helpBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  doneStepBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 28,
  },
  doneStepText: { fontSize: 20, fontWeight: "800" },
  celebrationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 32,
  },
  celebrationCard: { alignItems: "center", gap: 16 },
  celebrationIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  celebrationTitle: { fontSize: 32, fontWeight: "800" },
  celebrationSub: { fontSize: 16, textAlign: "center" },
  earnedBadge: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20 },
  earnedText: { fontSize: 28, fontWeight: "800" },
  balanceText: { fontSize: 14 },
  doneBtn: { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 28 },
  doneBtnText: { fontSize: 18, fontWeight: "700" },
});
