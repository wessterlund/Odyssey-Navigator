import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase, Step } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CameraModal, CapturedMedia } from "@/components/CameraModal";
import { MediaPreview } from "@/components/MediaPreview";

type PromptLevel = "Full Physical" | "Partial Physical" | "Gestural" | "Verbal" | "Independent";

type StepLocal = Step & {
  _uid: string;
  promptLevel?: PromptLevel;
  supportStrategy?: string;
};

interface ClinicalFramework {
  teacch?: {
    environmentSetup: string;
    visualSchedule: string;
    workSystem: string;
  };
  promptingPlan?: {
    strategy: string;
    hierarchy: string[];
    fadingPlan: string;
  };
  reinforcementPlan?: {
    schedule: string;
    type: string;
    reinforcers: string[];
    saturationPrevention: string;
  };
  videoModeling?: {
    recommended: boolean;
    type: string;
    duration: string;
    description: string;
  };
  generalizationPlan?: string[];
}

let _uidSeq = 0;
const makeUid = () => `step_${++_uidSeq}_${Date.now()}`;

const PROMPT_LEVEL_COLORS: Record<string, string> = {
  "Full Physical": "#EF4444",
  "Partial Physical": "#F97316",
  "Gestural": "#EAB308",
  "Verbal": "#3B82F6",
  "Independent": "#22C55E",
};

function PromptBadge({ level }: { level: string }) {
  const color = PROMPT_LEVEL_COLORS[level] ?? "#6B7280";
  return (
    <View style={[promptBadgeStyles.badge, { backgroundColor: color + "22", borderColor: color }]}>
      <View style={[promptBadgeStyles.dot, { backgroundColor: color }]} />
      <Text style={[promptBadgeStyles.text, { color }]}>{level}</Text>
    </View>
  );
}

const promptBadgeStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: "700" },
});

async function uploadToServer(localUri: string, mimeType: string): Promise<string> {
  const formData = new FormData();
  if (Platform.OS === "web") {
    const response = await fetch(localUri);
    const rawBlob = await response.blob();
    const cleanMime = mimeType.split(";")[0] || rawBlob.type || "application/octet-stream";
    const blob = new Blob([rawBlob], { type: cleanMime });
    const ext = cleanMime.startsWith("video/") ? ".mp4" : ".jpg";
    formData.append("file", blob, `pick${ext}`);
  } else {
    const ext = mimeType.startsWith("video/") ? ".mp4" : ".jpg";
    (formData as any).append("file", { uri: localUri, name: `pick${ext}`, type: mimeType });
  }
  const res = await fetch(`${apiBase()}/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  return data.url as string;
}

export default function CreateAdventureScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, loadAdventures } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [goal, setGoal] = useState("");
  const [generating, setGenerating] = useState(false);
  const [clinicalFramework, setClinicalFramework] = useState<ClinicalFramework | null>(null);
  const [frameworkExpanded, setFrameworkExpanded] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coinsPerStep, setCoinsPerStep] = useState("2");
  const [completionBonus, setCompletionBonus] = useState("5");
  const [steps, setSteps] = useState<StepLocal[]>([{ instruction: "", tip: "", _uid: makeUid() }]);
  const [saving, setSaving] = useState(false);

  const [cameraVisible, setCameraVisible] = useState(false);
  const activeStepUidRef = useRef<string | null>(null);
  const [uploadingStep, setUploadingStep] = useState<number | null>(null);
  const [replaceMenuStep, setReplaceMenuStep] = useState<string | null>(null);

  const generateAdventure = async () => {
    if (!currentLearner || !goal.trim()) {
      Alert.alert("Required", "Please enter a goal for the adventure.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${apiBase()}/ai/generate-adventure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId: currentLearner.id, goal }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();

      setTitle(data.title || "");
      setDescription(data.description || "");
      setCoinsPerStep(String(data.coinsPerStep || 2));
      setCompletionBonus(String(data.completionBonus || 5));

      setSteps((data.steps || []).map((s: any) => ({
        instruction: s.instruction,
        tip: s.tip || "",
        mediaSuggestion: s.mediaSuggestion || "",
        promptLevel: s.promptLevel || undefined,
        supportStrategy: s.supportStrategy || "",
        _uid: makeUid(),
      })));

      const framework: ClinicalFramework = {};
      if (data.teacch) framework.teacch = data.teacch;
      if (data.promptingPlan) framework.promptingPlan = data.promptingPlan;
      if (data.reinforcementPlan) framework.reinforcementPlan = data.reinforcementPlan;
      if (data.videoModeling) framework.videoModeling = data.videoModeling;
      if (data.generalizationPlan) framework.generalizationPlan = data.generalizationPlan;

      if (Object.keys(framework).length > 0) {
        setClinicalFramework(framework);
        setFrameworkExpanded(true);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "AI generation failed. Please try again.");
    }
    setGenerating(false);
  };

  const saveAdventure = async () => {
    if (!currentLearner || !title.trim()) {
      Alert.alert("Required", "Please enter a title.");
      return;
    }
    if (steps.some((s) => !s.instruction.trim())) {
      Alert.alert("Required", "All steps must have instructions.");
      return;
    }
    setSaving(true);
    try {
      const stepsToSave = steps.map(({ _uid, promptLevel, supportStrategy, ...s }) => {
        let tip = s.tip || "";
        if (promptLevel) {
          tip = `[Prompt: ${promptLevel}] ${supportStrategy || tip}`.trim();
        }
        return { ...s, tip };
      });

      const res = await fetch(`${apiBase()}/adventures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: currentLearner.id,
          title,
          description: description || null,
          coinsPerStep: parseInt(coinsPerStep) || 2,
          completionBonus: parseInt(completionBonus) || 5,
          steps: stepsToSave,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await loadAdventures(currentLearner.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save adventure.");
    }
    setSaving(false);
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { instruction: "", tip: "", _uid: makeUid() }]);
  };

  const updateStep = (index: number, field: keyof Step, value: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const pickImageForStep = async (index: number, source: "gallery" | "camera") => {
    let result: ImagePicker.ImagePickerResult;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Camera permission is required."); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [4, 3] });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Photo library permission is required."); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.8, allowsEditing: true, aspect: [4, 3] });
    }

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mediaType = (asset.type === "video" ? "video" : "image") as "image" | "video";
      const mimeType = asset.mimeType || (mediaType === "video" ? "video/mp4" : "image/jpeg");
      setUploadingStep(index);
      let finalUri = asset.uri;
      try { finalUri = await uploadToServer(asset.uri, mimeType); } catch {}
      setUploadingStep(null);
      const updated = [...steps];
      updated[index] = { ...updated[index], mediaUrl: finalUri, mediaType };
      setSteps(updated);
    }
  };

  const removeMediaFromStep = (index: number) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], mediaUrl: undefined, mediaType: undefined };
    setSteps(updated);
  };

  const openCamera = (uid: string) => {
    activeStepUidRef.current = uid;
    setCameraVisible(true);
    setReplaceMenuStep(null);
  };

  const handleCameraConfirm = (media: CapturedMedia) => {
    const uid = activeStepUidRef.current;
    if (!uid) return;
    setSteps((prev) => prev.map((s) => (s._uid === uid ? { ...s, mediaUrl: media.uri, mediaType: media.type } : s)));
    activeStepUidRef.current = null;
    setCameraVisible(false);
  };

  const handleMediaReplace = (oldUri: string, newUri: string) => {
    setSteps((prev) => prev.map((s) => (s.mediaUrl === oldUri ? { ...s, mediaUrl: newUri } : s)));
  };

  if (!currentLearner) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Please select a learner first</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Adventure</Text>
        <TouchableOpacity onPress={saveAdventure} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <CameraModal
        visible={cameraVisible}
        onClose={() => { setCameraVisible(false); activeStepUidRef.current = null; }}
        onConfirm={handleCameraConfirm}
        onReplace={handleMediaReplace}
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 40 }]}>
        {/* AI Generation Section */}
        <View style={[styles.aiCard, { backgroundColor: colors.secondary }]}>
          <View style={styles.aiCardHeader}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={[styles.aiCardTitle, { color: colors.primary }]}>Generate with AI</Text>
          </View>
          <Text style={[styles.aiCardSub, { color: colors.mutedForeground }]}>
            Clinical adventure for {currentLearner.name} — includes prompting, TEACCH & reinforcement plan
          </Text>
          <TextInput
            style={[styles.goalInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            value={goal}
            onChangeText={setGoal}
            placeholder="e.g. Learn to brush teeth independently"
            placeholderTextColor={colors.mutedForeground}
            multiline
          />
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: colors.primary, opacity: generating ? 0.7 : 1 }]}
            onPress={generateAdventure}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Ionicons name="flash" size={18} color={colors.primaryForeground} />
                <Text style={[styles.generateBtnText, { color: colors.primaryForeground }]}>Generate Clinical Adventure</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Clinical Framework Section */}
        {clinicalFramework && (
          <View style={[styles.frameworkCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.frameworkHeader}
              onPress={() => setFrameworkExpanded(!frameworkExpanded)}
            >
              <View style={styles.frameworkHeaderLeft}>
                <Ionicons name="medical" size={16} color="#8B5CF6" />
                <Text style={[styles.frameworkTitle, { color: "#8B5CF6" }]}>Clinical Framework</Text>
              </View>
              <Ionicons
                name={frameworkExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            {frameworkExpanded && (
              <View style={styles.frameworkBody}>
                {/* TEACCH */}
                {clinicalFramework.teacch && (
                  <View style={[styles.frameworkBlock, { borderLeftColor: "#3B82F6" }]}>
                    <Text style={styles.frameworkBlockTitle}>🏫 TEACCH Structure</Text>
                    <Text style={styles.frameworkItem}>
                      <Text style={styles.frameworkLabel}>Environment: </Text>
                      {clinicalFramework.teacch.environmentSetup}
                    </Text>
                    <Text style={styles.frameworkItem}>
                      <Text style={styles.frameworkLabel}>Visual schedule: </Text>
                      {clinicalFramework.teacch.visualSchedule}
                    </Text>
                    <Text style={styles.frameworkItem}>
                      <Text style={styles.frameworkLabel}>Work system: </Text>
                      {clinicalFramework.teacch.workSystem}
                    </Text>
                  </View>
                )}

                {/* Prompting Plan */}
                {clinicalFramework.promptingPlan && (
                  <View style={[styles.frameworkBlock, { borderLeftColor: "#EF4444" }]}>
                    <Text style={styles.frameworkBlockTitle}>👋 Prompting Plan</Text>
                    <Text style={styles.frameworkItem}>
                      <Text style={styles.frameworkLabel}>Strategy: </Text>
                      {clinicalFramework.promptingPlan.strategy}
                    </Text>
                    <View style={styles.hierarchyRow}>
                      {clinicalFramework.promptingPlan.hierarchy.map((h, i) => (
                        <View
                          key={i}
                          style={[styles.hierarchyPill, { backgroundColor: Object.values(PROMPT_LEVEL_COLORS)[i] + "22", borderColor: Object.values(PROMPT_LEVEL_COLORS)[i] }]}
                        >
                          <Text style={[styles.hierarchyPillText, { color: Object.values(PROMPT_LEVEL_COLORS)[i] }]}>{h}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.frameworkItem}>
                      <Text style={styles.frameworkLabel}>Fading: </Text>
                      {clinicalFramework.promptingPlan.fadingPlan}
                    </Text>
                  </View>
                )}

                {/* Reinforcement Plan */}
                {clinicalFramework.reinforcementPlan && (
                  <View style={[styles.frameworkBlock, { borderLeftColor: "#22C55E" }]}>
                    <Text style={styles.frameworkBlockTitle}>⭐ Reinforcement Plan</Text>
                    <Text style={styles.frameworkItem}>
                      <Text style={styles.frameworkLabel}>Schedule: </Text>
                      {clinicalFramework.reinforcementPlan.schedule}
                    </Text>
                    <Text style={styles.frameworkItem}>
                      <Text style={styles.frameworkLabel}>Type: </Text>
                      {clinicalFramework.reinforcementPlan.type}
                    </Text>
                    {clinicalFramework.reinforcementPlan.reinforcers.length > 0 && (
                      <Text style={styles.frameworkItem}>
                        <Text style={styles.frameworkLabel}>Reinforcers: </Text>
                        {clinicalFramework.reinforcementPlan.reinforcers.join(" · ")}
                      </Text>
                    )}
                    <Text style={styles.frameworkItem}>
                      <Text style={styles.frameworkLabel}>Anti-saturation: </Text>
                      {clinicalFramework.reinforcementPlan.saturationPrevention}
                    </Text>
                  </View>
                )}

                {/* Video Modeling */}
                {clinicalFramework.videoModeling?.recommended && (
                  <View style={[styles.frameworkBlock, { borderLeftColor: "#F97316" }]}>
                    <Text style={styles.frameworkBlockTitle}>🎥 Video Modeling</Text>
                    <Text style={styles.frameworkItem}>
                      <Text style={styles.frameworkLabel}>Type: </Text>
                      {clinicalFramework.videoModeling.type} · {clinicalFramework.videoModeling.duration}
                    </Text>
                    <Text style={styles.frameworkItem}>{clinicalFramework.videoModeling.description}</Text>
                  </View>
                )}

                {/* Generalization */}
                {clinicalFramework.generalizationPlan && clinicalFramework.generalizationPlan.length > 0 && (
                  <View style={[styles.frameworkBlock, { borderLeftColor: "#EAB308" }]}>
                    <Text style={styles.frameworkBlockTitle}>🌍 Generalization Plan</Text>
                    {clinicalFramework.generalizationPlan.map((g, i) => (
                      <Text key={i} style={styles.frameworkItem}>• {g}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or create manually</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Title *</Text>
          <TextInput
            style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Adventure title"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Description</Text>
          <TextInput
            style={[styles.fieldInput, styles.multiline, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.coinRow}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Coins / Step</Text>
            <TextInput
              style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
              value={coinsPerStep}
              onChangeText={setCoinsPerStep}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Bonus on Finish</Text>
            <TextInput
              style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
              value={completionBonus}
              onChangeText={setCompletionBonus}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.stepsSection}>
          <Text style={[styles.stepsTitle, { color: colors.foreground }]}>
            Steps — Task Analysis
          </Text>
          {steps.map((step, index) => (
            <View key={step._uid} style={[styles.stepCard, { backgroundColor: colors.card }]}>
              <View style={styles.stepHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumText}>{index + 1}</Text>
                  </View>
                  {step.promptLevel && <PromptBadge level={step.promptLevel} />}
                </View>
                {steps.length > 1 && (
                  <TouchableOpacity onPress={() => removeStep(index)}>
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={[styles.stepInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
                value={step.instruction}
                onChangeText={(t) => updateStep(index, "instruction", t)}
                placeholder="Step instruction..."
                placeholderTextColor={colors.mutedForeground}
                multiline
              />

              {step.mediaSuggestion ? (
                <Text style={[styles.mediaSuggestion, { color: colors.mutedForeground }]}>
                  💡 Media idea: {step.mediaSuggestion}
                </Text>
              ) : null}

              {step.supportStrategy ? (
                <View style={[styles.supportBox, { backgroundColor: "#EF444415", borderColor: "#EF4444" }]}>
                  <Ionicons name="hand-left" size={13} color="#EF4444" />
                  <Text style={[styles.supportText, { color: "#B91C1C" }]}>{step.supportStrategy}</Text>
                </View>
              ) : null}

              {step.tip && !step.supportStrategy ? (
                <View style={[styles.tipBox, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="information-circle" size={15} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.primary }]}>{step.tip}</Text>
                </View>
              ) : null}

              {/* Media section */}
              {uploadingStep === index ? (
                <View style={[styles.mediaUploadingRow, { borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.mediaBtnText, { color: colors.mutedForeground }]}>Uploading…</Text>
                </View>
              ) : step.mediaUrl ? (
                <View style={styles.mediaPreviewContainer}>
                  <MediaPreview
                    uri={step.mediaUrl}
                    mediaType={step.mediaType ?? "image"}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.mediaPreviewOverlay}>
                    {replaceMenuStep === step._uid ? (
                      <View style={[styles.replaceMenu, { backgroundColor: colors.card }]}>
                        <TouchableOpacity style={styles.replaceMenuItem} onPress={() => { pickImageForStep(index, "gallery"); setReplaceMenuStep(null); }}>
                          <Ionicons name="images-outline" size={15} color={colors.foreground} />
                          <Text style={[styles.replaceMenuText, { color: colors.foreground }]}>Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.replaceMenuItem} onPress={() => { openCamera(step._uid); setReplaceMenuStep(null); }}>
                          <Ionicons name="camera-outline" size={15} color={colors.foreground} />
                          <Text style={[styles.replaceMenuText, { color: colors.foreground }]}>Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.replaceMenuItem} onPress={() => { removeMediaFromStep(index); setReplaceMenuStep(null); }}>
                          <Ionicons name="trash-outline" size={15} color="#EF4444" />
                          <Text style={[styles.replaceMenuText, { color: "#EF4444" }]}>Remove</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.replaceMenuItem} onPress={() => setReplaceMenuStep(null)}>
                          <Ionicons name="close" size={15} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.mediaReplaceBtn}
                        onPress={() => {
                          if (Platform.OS === "web") {
                            setReplaceMenuStep(step._uid);
                          } else {
                            Alert.alert("Replace Media", "Choose source:", [
                              { text: "Gallery / Files", onPress: () => pickImageForStep(index, "gallery") },
                              { text: "Camera", onPress: () => openCamera(step._uid) },
                              { text: "Remove", style: "destructive", onPress: () => removeMediaFromStep(index) },
                              { text: "Cancel", style: "cancel" },
                            ]);
                          }
                        }}
                      >
                        <Ionicons name="camera" size={16} color="#fff" />
                        <Text style={styles.mediaReplaceBtnText}>Replace</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.mediaButtonsRow}>
                  <TouchableOpacity style={[styles.mediaBtn, { borderColor: colors.border }]} onPress={() => pickImageForStep(index, "gallery")} disabled={uploadingStep !== null}>
                    <Ionicons name="images-outline" size={18} color={colors.primary} />
                    <Text style={[styles.mediaBtnText, { color: colors.primary }]}>Upload</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.mediaBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]} onPress={() => openCamera(step._uid)} disabled={uploadingStep !== null}>
                    <Ionicons name="camera-outline" size={18} color={colors.primary} />
                    <Text style={[styles.mediaBtnText, { color: colors.primary }]}>Record</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity style={[styles.addStepBtn, { borderColor: colors.border }]} onPress={addStep}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={[styles.addStepText, { color: colors.primary }]}>Add Step</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 15 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  saveText: { fontSize: 16, fontWeight: "700" },
  content: { paddingHorizontal: 20, gap: 18 },
  aiCard: { borderRadius: 16, padding: 18, gap: 10 },
  aiCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiCardTitle: { fontSize: 16, fontWeight: "700" },
  aiCardSub: { fontSize: 13, lineHeight: 18 },
  goalInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 60 },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  generateBtnText: { fontSize: 15, fontWeight: "700" },
  frameworkCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  frameworkHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
  frameworkHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  frameworkTitle: { fontSize: 14, fontWeight: "700" },
  frameworkBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 12 },
  frameworkBlock: { borderLeftWidth: 3, paddingLeft: 10, gap: 4 },
  frameworkBlockTitle: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 2 },
  frameworkLabel: { fontWeight: "700", fontSize: 12 },
  frameworkItem: { fontSize: 12, color: "#4B5563", lineHeight: 18 },
  hierarchyRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginVertical: 4 },
  hierarchyPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  hierarchyPillText: { fontSize: 10, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", letterSpacing: 0.4 },
  fieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  coinRow: { flexDirection: "row", gap: 12 },
  stepsSection: { gap: 12 },
  stepsTitle: { fontSize: 17, fontWeight: "700" },
  stepCard: { borderRadius: 14, padding: 14, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  stepHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  stepInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, minHeight: 60, textAlignVertical: "top" },
  mediaSuggestion: { fontSize: 12, fontStyle: "italic", lineHeight: 17 },
  supportBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  supportText: { fontSize: 12, flex: 1, lineHeight: 17, fontWeight: "500" },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 8, borderRadius: 8 },
  tipText: { fontSize: 12, flex: 1, lineHeight: 17 },
  mediaButtonsRow: { flexDirection: "row", gap: 8 },
  mediaBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  mediaBtnText: { fontSize: 13, fontWeight: "600" },
  mediaUploadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  mediaPreviewContainer: { borderRadius: 10, overflow: "hidden", height: 150, position: "relative" },
  mediaPreviewOverlay: { position: "absolute", inset: 0, alignItems: "flex-end", justifyContent: "flex-start", padding: 8 },
  mediaReplaceBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  mediaReplaceBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  replaceMenu: { borderRadius: 10, padding: 6, gap: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  replaceMenuItem: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 10, paddingVertical: 7 },
  replaceMenuText: { fontSize: 13, fontWeight: "600" },
  addStepBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: "dashed" },
  addStepText: { fontSize: 15, fontWeight: "600" },
});
