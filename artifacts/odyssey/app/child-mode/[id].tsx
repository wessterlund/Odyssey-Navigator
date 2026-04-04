import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useApp, apiBase, Adventure } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W } = Dimensions.get("window");

type ChildState = "start" | "step" | "encourage" | "retry" | "complete";

const OCEAN_BG: [string, string, string] = ["#B8E4F9", "#D6F0FF", "#EAF6FF"];
const CELEBRATE_BG: [string, string, string] = ["#FFE5A0", "#FFF3CC", "#FFFAE6"];
const STEP_BG: [string, string, string] = ["#C4E8FC", "#DCF3FF", "#EDF9FF"];

export default function ChildModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, wallet, refreshAll } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ChildState>("start");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [stepCoinsEarned, setStepCoinsEarned] = useState(0);
  const [bonusEarned, setBonusEarned] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [startTime, setStartTime] = useState(Date.now());
  const [copilotTip, setCopilotTip] = useState<string | null>(null);
  const [showCopilot, setShowCopilot] = useState(false);
  const [loadingTip, setLoadingTip] = useState(false);

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const coinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAdventure();
    return () => { if (tipTimer.current) clearTimeout(tipTimer.current); };
  }, [id]);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();

    if (state === "step") {
      if (tipTimer.current) clearTimeout(tipTimer.current);
      tipTimer.current = setTimeout(() => {
        if (!completing && adventure && currentLearner) fetchCopilotTip();
      }, 30000);
    }
    return () => { if (tipTimer.current) clearTimeout(tipTimer.current); };
  }, [state, currentStepIndex]);

  useEffect(() => {
    startBounce();
  }, [state]);

  const startBounce = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.08, duration: 200, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  };

  const animateCoin = () => {
    coinAnim.setValue(0);
    Animated.sequence([
      Animated.spring(coinAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 5 }),
      Animated.delay(600),
      Animated.timing(coinAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const fetchAdventure = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/adventures/${id}`);
      const data = await res.json();
      setAdventure(data);
    } catch {
      Alert.alert("Oops!", "Could not load adventure.", [
        { text: "Go back", onPress: () => router.back() },
      ]);
    }
    setLoading(false);
  };

  const fetchCopilotTip = async () => {
    if (!currentLearner || !adventure) return;
    const step = adventure.steps[currentStepIndex];
    if (!step) return;
    setLoadingTip(true);
    try {
      const res = await fetch(`${apiBase()}/ai/copilot-tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: currentLearner.id,
          stepInstruction: step.instruction,
          attempts,
          elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
        }),
      });
      const data = await res.json();
      setCopilotTip(data.tip);
      setShowCopilot(true);
    } catch {}
    setLoadingTip(false);
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
    try {
      await fetch(`${apiBase()}/ai/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: currentLearner.id,
          stepId: stepId ?? null,
          adventureId: adventure.id,
          completionTime: Math.floor((Date.now() - startTime) / 1000),
          attempts,
          success,
        }),
      });
    } catch {}
  };

  const handleStepDone = async () => {
    if (!adventure || completing) return;
    const step = adventure.steps[currentStepIndex];
    setCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await earnCoins(adventure.coinsPerStep, "step", `Step ${currentStepIndex + 1}: ${step.instruction.slice(0, 40)}`);
    await trackPerformance(step.id, true);
    setTotalEarned((prev) => prev + adventure.coinsPerStep);
    setStepCoinsEarned((prev) => prev + adventure.coinsPerStep);
    animateCoin();

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= adventure.steps.length) {
      await earnCoins(adventure.completionBonus, "completion", `Completed: ${adventure.title}`);
      setTotalEarned((prev) => prev + adventure.completionBonus);
      setBonusEarned(adventure.completionBonus);
      await fetch(`${apiBase()}/adventures/${adventure.id}/complete`, { method: "PUT" });
      if (currentLearner) await refreshAll(currentLearner.id);
      setState("complete");
    } else {
      setTimeout(() => {
        setCurrentStepIndex(nextIndex);
        setAttempts(1);
        setStartTime(Date.now());
        setCopilotTip(null);
        setShowCopilot(false);
        setState("encourage");
      }, 300);
    }
    setCompleting(false);
  };

  const handleStepSkip = async () => {
    if (!adventure || completing) return;
    const step = adventure.steps[currentStepIndex];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await trackPerformance(step.id, false);
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= adventure.steps.length) {
      if (currentLearner) await refreshAll(currentLearner.id);
      setState("complete");
    } else {
      setCurrentStepIndex(nextIndex);
      setAttempts(1);
      setStartTime(Date.now());
      setCopilotTip(null);
      setShowCopilot(false);
      setState("retry");
    }
  };

  const handleHelpPress = () => {
    setAttempts((a) => a + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchCopilotTip();
  };

  if (loading) {
    return (
      <LinearGradient colors={OCEAN_BG} style={styles.centered}>
        <Image source={require("@/assets/images/octopus.png")} style={styles.loadingOctopus} contentFit="contain" />
        <ActivityIndicator size="large" color="#2F80ED" style={{ marginTop: 16 }} />
      </LinearGradient>
    );
  }

  if (!adventure || adventure.steps.length === 0) {
    return (
      <LinearGradient colors={OCEAN_BG} style={styles.centered}>
        <Text style={styles.emptyText}>No steps in this adventure</Text>
        <TouchableOpacity style={styles.backBtnLg} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (state === "start") {
    return (
      <LinearGradient colors={OCEAN_BG} style={[styles.fullscreen, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.exitBtn, { top: topInset + 8 }]}>
          <Ionicons name="close" size={22} color="#3B6CA8" />
        </TouchableOpacity>

        <Animated.View style={[styles.centerContent, { transform: [{ scale: bounceAnim }] }]}>
          <Image
            source={require("@/assets/images/octopus.png")}
            style={styles.octopusBig}
            contentFit="contain"
          />
        </Animated.View>

        <View style={styles.startCard}>
          <Text style={styles.startTitle}>It's time for an{"\n"}adventure!</Text>
          <Text style={styles.startSub}>{adventure.title}</Text>
          <View style={styles.startMeta}>
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text style={styles.startMetaText}>
              Up to {(adventure.steps.length * adventure.coinsPerStep) + adventure.completionBonus} coins
            </Text>
          </View>
          <TouchableOpacity
            style={styles.letsGoBtn}
            activeOpacity={0.85}
            onPress={() => setState("step")}
          >
            <Text style={styles.letsGoBtnText}>Let's go!</Text>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (state === "encourage") {
    return (
      <LinearGradient colors={OCEAN_BG} style={[styles.fullscreen, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <Animated.View style={[styles.centerContent, { transform: [{ scale: bounceAnim }] }]}>
          <Image
            source={require("@/assets/images/octopus-encourage.png")}
            style={styles.octopusBig}
            contentFit="contain"
          />
        </Animated.View>
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Good Job!</Text>
          <Text style={styles.feedbackSub}>Let's do the next step</Text>
          <View style={styles.coinsEarnedRow}>
            {Array.from({ length: Math.min(adventure.coinsPerStep, 6) }).map((_, i) => (
              <Text key={i} style={styles.coinEmoji}>🪙</Text>
            ))}
          </View>
          <TouchableOpacity
            style={styles.nextBtn}
            activeOpacity={0.85}
            onPress={() => setState("step")}
          >
            <Text style={styles.nextBtnText}>Next step</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (state === "retry") {
    return (
      <LinearGradient colors={OCEAN_BG} style={[styles.fullscreen, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <Animated.View style={[styles.centerContent, { transform: [{ scale: bounceAnim }] }]}>
          <Image
            source={require("@/assets/images/octopus-encourage.png")}
            style={styles.octopusBig}
            contentFit="contain"
          />
        </Animated.View>
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>You can do it!</Text>
          <Text style={styles.feedbackSub}>Let's try again next time</Text>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: "#F59E0B" }]}
            activeOpacity={0.85}
            onPress={() => setState("step")}
          >
            <Text style={styles.nextBtnText}>Next step</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (state === "complete") {
    return (
      <LinearGradient colors={CELEBRATE_BG} style={[styles.fullscreen, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <Animated.View style={[styles.centerContent, { transform: [{ scale: bounceAnim }] }]}>
          <Image
            source={require("@/assets/images/octopus-celebrate.png")}
            style={styles.octopusBig}
            contentFit="contain"
          />
        </Animated.View>
        <View style={[styles.feedbackCard, styles.celebrateCard]}>
          <Text style={styles.celebrateWoohoo}>Woohoo!</Text>
          <Text style={styles.celebrateTitle}>Great job,{"\n"}{currentLearner?.name ?? "Champion"}!</Text>
          <View style={styles.coinsBigRow}>
            {Array.from({ length: Math.min(totalEarned, 8) }).map((_, i) => (
              <Text key={i} style={styles.coinEmojiBig}>🪙</Text>
            ))}
          </View>
          {/* Coin breakdown */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Steps completed</Text>
              <Text style={styles.breakdownCoins}>+{stepCoinsEarned} 🪙</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Completion bonus</Text>
              <Text style={styles.breakdownCoins}>+{bonusEarned} 🪙</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { fontWeight: "900" }]}>Total earned</Text>
              <Text style={[styles.breakdownCoins, { fontSize: 20 }]}>{totalEarned} 🪙</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: "#F59E0B", marginTop: 4 }]}
            activeOpacity={0.85}
            onPress={() => {
              router.back();
              setTimeout(() => router.push("/(tabs)/rewards"), 300);
            }}
          >
            <Ionicons name="gift" size={20} color="#fff" />
            <Text style={styles.nextBtnText}>Redeem reward</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.doneLink}>
            <Text style={styles.doneLinkText}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Step state
  const step = adventure.steps[currentStepIndex];
  const progress = (currentStepIndex / adventure.steps.length) * 100;

  return (
    <LinearGradient colors={STEP_BG} style={[styles.fullscreen, { paddingTop: topInset, paddingBottom: bottomInset }]}>
      {/* Top bar */}
      <View style={styles.stepTopBar}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert("Exit Adventure", "Are you sure?", [
              { text: "Stay", style: "cancel" },
              { text: "Exit", onPress: () => router.back() },
            ]);
          }}
          style={styles.exitBtnSmall}
        >
          <Ionicons name="close" size={20} color="#3B6CA8" />
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>

        <View style={styles.coinBadge}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.coinBadgeText}>{totalEarned}</Text>
        </View>
      </View>

      <Text style={styles.stepCounter}>
        Step {currentStepIndex + 1} of {adventure.steps.length}
      </Text>

      {/* Media area */}
      <View style={styles.mediaContainer}>
        {step.mediaUrl ? (
          <Image
            source={{ uri: step.mediaUrl }}
            style={styles.stepMedia}
            contentFit="cover"
          />
        ) : (
          <View style={styles.stepMediaPlaceholder}>
            <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
              <Image
                source={require("@/assets/images/octopus.png")}
                style={styles.octopusSmall}
                contentFit="contain"
              />
            </Animated.View>
          </View>
        )}
      </View>

      {/* Instruction card */}
      <View style={styles.instructionCard}>
        <Text style={styles.instructionText}>{step.instruction}</Text>

        {showCopilot && copilotTip ? (
          <View style={styles.copilotBubble}>
            <View style={styles.copilotHeader}>
              <Ionicons name="bulb" size={16} color="#F59E0B" />
              <Text style={styles.copilotLabel}>Tip for teacher</Text>
              <TouchableOpacity onPress={() => setShowCopilot(false)}>
                <Ionicons name="close" size={14} color="#aaa" />
              </TouchableOpacity>
            </View>
            <Text style={styles.copilotText}>{copilotTip}</Text>
          </View>
        ) : null}
      </View>

      {/* Floating coin animation */}
      <Animated.View
        style={[
          styles.floatingCoin,
          {
            opacity: coinAnim,
            transform: [
              {
                translateY: coinAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -80],
                }),
              },
              {
                scale: coinAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.4, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.floatingCoinText}>+{adventure.coinsPerStep} 🪙</Text>
      </Animated.View>

      {/* Action buttons */}
      <View style={[styles.bottomActions, { paddingBottom: bottomInset + 8 }]}>
        <TouchableOpacity
          style={styles.helpBtn}
          onPress={handleHelpPress}
          disabled={loadingTip}
        >
          {loadingTip ? (
            <ActivityIndicator size="small" color="#2F80ED" />
          ) : (
            <Ionicons name="help-circle-outline" size={26} color="#2F80ED" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.doneBtn, { opacity: completing ? 0.7 : 1 }]}
          onPress={handleStepDone}
          disabled={completing}
          activeOpacity={0.85}
        >
          {completing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={28} color="#fff" />
              <Text style={styles.doneBtnText}>Done</Text>
              <View style={styles.doneCoinBadge}>
                <Text style={styles.doneCoinText}>+{adventure.coinsPerStep} 🪙</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleStepSkip}
          disabled={completing}
        >
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingOctopus: { width: 120, height: 120 },
  emptyText: { fontSize: 20, fontWeight: "700", color: "#1E3A5F" },
  backBtnLg: {
    marginTop: 16,
    backgroundColor: "#2F80ED",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  exitBtn: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: 16 },
  octopusBig: { width: SCREEN_W * 0.65, height: SCREEN_W * 0.65, maxWidth: 300, maxHeight: 300 },
  octopusSmall: { width: 140, height: 140 },
  startCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  startTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1E3A5F",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  startSub: { fontSize: 16, color: "#6B93C0", fontWeight: "600" },
  startMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  startMetaText: { fontSize: 15, color: "#F59E0B", fontWeight: "700" },
  letsGoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2F80ED",
    borderRadius: 20,
    paddingVertical: 18,
    marginTop: 8,
  },
  letsGoBtnText: { fontSize: 22, fontWeight: "900", color: "#fff" },
  feedbackCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: 20,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrateCard: { gap: 8 },
  feedbackTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#1E3A5F",
    letterSpacing: -0.5,
  },
  feedbackSub: { fontSize: 17, color: "#6B93C0", fontWeight: "600" },
  coinsEarnedRow: { flexDirection: "row", gap: 4, marginTop: 4, flexWrap: "wrap", justifyContent: "center" },
  coinEmoji: { fontSize: 26 },
  coinEmojiBig: { fontSize: 32 },
  coinsBigRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 },
  celebrateWoohoo: { fontSize: 22, fontWeight: "900", color: "#F59E0B", letterSpacing: 1 },
  celebrateTitle: { fontSize: 30, fontWeight: "900", color: "#1E3A5F", textAlign: "center", lineHeight: 36 },
  celebrateSub: { fontSize: 16, color: "#6B93C0", fontWeight: "600" },
  coinsCount: { fontSize: 40, fontWeight: "900", color: "#F59E0B" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2F80ED",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    marginTop: 4,
  },
  nextBtnText: { fontSize: 20, fontWeight: "900", color: "#fff" },
  doneLink: { marginTop: 4, paddingVertical: 8 },
  doneLinkText: { fontSize: 16, color: "#6B93C0", fontWeight: "600" },
  breakdownCard: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    padding: 14,
    width: "100%",
    gap: 0,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  breakdownLabel: { fontSize: 14, color: "#1E3A5F", fontWeight: "600" },
  breakdownCoins: { fontSize: 15, fontWeight: "800", color: "#F59E0B" },
  breakdownDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.07)" },
  // Step state styles
  stepTopBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  exitBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2F80ED",
    borderRadius: 5,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinBadgeText: { fontSize: 15, fontWeight: "800", color: "#F59E0B" },
  stepCounter: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#3B6CA8",
    paddingBottom: 8,
  },
  mediaContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.6)",
    maxHeight: 320,
    minHeight: 180,
  },
  stepMedia: { width: "100%", height: "100%" },
  stepMediaPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  instructionText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E3A5F",
    textAlign: "center",
    lineHeight: 30,
  },
  copilotBubble: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  copilotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  copilotLabel: { fontSize: 12, fontWeight: "700", color: "#2F80ED", flex: 1 },
  copilotText: { fontSize: 13, color: "#374151", lineHeight: 18 },
  floatingCoin: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
  },
  floatingCoinText: { fontSize: 28, fontWeight: "900", color: "#F59E0B" },
  bottomActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  helpBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2F80ED",
    borderRadius: 20,
    height: 60,
  },
  doneBtnText: { fontSize: 22, fontWeight: "900", color: "#fff" },
  doneCoinBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  doneCoinText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  skipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtnText: { fontSize: 13, fontWeight: "700", color: "#6B93C0" },
});
