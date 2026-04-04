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

// Steps get a local _uid during creation so camera tracking is stable (no array-index drift)
type StepLocal = Step & { _uid: string };
let _uidSeq = 0;
const makeUid = () => `step_${++_uidSeq}_${Date.now()}`;

async function uploadToServer(localUri: string, mimeType: string): Promise<string> {
  const formData = new FormData();
  if (Platform.OS === "web") {
    const response = await fetch(localUri);
    const rawBlob = await response.blob();
    // Re-type the blob so the server always receives a proper image/ or video/ MIME type
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coinsPerStep, setCoinsPerStep] = useState("2");
  const [completionBonus, setCompletionBonus] = useState("5");
  const [steps, setSteps] = useState<StepLocal[]>([{ instruction: "", tip: "", _uid: makeUid() }]);
  const [saving, setSaving] = useState(false);

  const [cameraVisible, setCameraVisible] = useState(false);
  // Track the target step by _uid (stable string ID) — immune to array index changes
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
        _uid: makeUid(),
      })));
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
      const res = await fetch(`${apiBase()}/adventures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: currentLearner.id,
          title,
          description: description || null,
          coinsPerStep: parseInt(coinsPerStep) || 2,
          completionBonus: parseInt(completionBonus) || 5,
          steps: steps.map(({ _uid, ...s }) => s), // strip local-only _uid before sending
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
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library permission is required.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
    }

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mediaType = (asset.type === "video" ? "video" : "image") as "image" | "video";
      const mimeType = asset.mimeType || (mediaType === "video" ? "video/mp4" : "image/jpeg");

      setUploadingStep(index);
      let finalUri = asset.uri;
      try {
        finalUri = await uploadToServer(asset.uri, mimeType);
      } catch {
        // fall back to local URI; media still attaches, just won't persist across devices
      }
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

  // uid = step._uid (a stable string, not an array index)
  const openCamera = (uid: string) => {
    activeStepUidRef.current = uid;
    setCameraVisible(true);
    setReplaceMenuStep(null);
  };

  // attachVideoToStep — called by CameraModal's onConfirm once upload completes
  const handleCameraConfirm = (media: CapturedMedia) => {
    const uid = activeStepUidRef.current;
    if (!uid) return;
    // Functional updater + uid match: immune to array-index changes and stale closures
    setSteps((prev) =>
      prev.map((s) => (s._uid === uid ? { ...s, mediaUrl: media.uri, mediaType: media.type } : s))
    );
    activeStepUidRef.current = null;
    setCameraVisible(false);
  };

  if (!currentLearner) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Please select a learner first
        </Text>
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
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 40 }]}>
        {/* AI Generation Section */}
        <View style={[styles.aiCard, { backgroundColor: colors.secondary }]}>
          <View style={styles.aiCardHeader}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={[styles.aiCardTitle, { color: colors.primary }]}>
              Generate with AI
            </Text>
          </View>
          <Text style={[styles.aiCardSub, { color: colors.mutedForeground }]}>
            Personalized for {currentLearner.name}
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
                <Text style={[styles.generateBtnText, { color: colors.primaryForeground }]}>
                  Generate Adventure
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

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
          <Text style={[styles.stepsTitle, { color: colors.foreground }]}>Steps</Text>
          {steps.map((step, index) => (
            <View key={step._uid} style={[styles.stepCard, { backgroundColor: colors.card }]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>{index + 1}</Text>
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
                  💡 Image idea: {step.mediaSuggestion}
                </Text>
              ) : null}

              {step.tip ? (
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
                      // Web-friendly inline replace menu
                      <View style={[styles.replaceMenu, { backgroundColor: colors.card }]}>
                        <TouchableOpacity
                          style={styles.replaceMenuItem}
                          onPress={() => { pickImageForStep(index, "gallery"); setReplaceMenuStep(null); }}
                        >
                          <Ionicons name="images-outline" size={15} color={colors.foreground} />
                          <Text style={[styles.replaceMenuText, { color: colors.foreground }]}>Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.replaceMenuItem}
                          onPress={() => { openCamera(step._uid); setReplaceMenuStep(null); }}
                        >
                          <Ionicons name="camera-outline" size={15} color={colors.foreground} />
                          <Text style={[styles.replaceMenuText, { color: colors.foreground }]}>Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.replaceMenuItem}
                          onPress={() => { removeMediaFromStep(index); setReplaceMenuStep(null); }}
                        >
                          <Ionicons name="trash-outline" size={15} color="#EF4444" />
                          <Text style={[styles.replaceMenuText, { color: "#EF4444" }]}>Remove</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.replaceMenuItem}
                          onPress={() => setReplaceMenuStep(null)}
                        >
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
                  <TouchableOpacity
                    style={[styles.mediaBtn, { borderColor: colors.border }]}
                    onPress={() => pickImageForStep(index, "gallery")}
                    disabled={uploadingStep !== null}
                  >
                    <Ionicons name="images-outline" size={18} color={colors.primary} />
                    <Text style={[styles.mediaBtnText, { color: colors.primary }]}>Upload</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.mediaBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                    onPress={() => openCamera(step._uid)}
                    disabled={uploadingStep !== null}
                  >
                    <Ionicons name="camera-outline" size={18} color={colors.primary} />
                    <Text style={[styles.mediaBtnText, { color: colors.primary }]}>Record</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addStepBtn, { borderColor: colors.border }]}
            onPress={addStep}
          >
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
  aiCardSub: { fontSize: 13 },
  goalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 60,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  generateBtnText: { fontSize: 15, fontWeight: "700" },
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
  stepCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stepHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  stepInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, minHeight: 60, textAlignVertical: "top" },
  mediaSuggestion: { fontSize: 12, fontStyle: "italic", lineHeight: 17 },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 10, borderRadius: 8 },
  tipText: { fontSize: 13, flex: 1, lineHeight: 18 },
  mediaUploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
  },
  mediaButtonsRow: { flexDirection: "row", gap: 10 },
  mediaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 10,
  },
  mediaBtnText: { fontSize: 14, fontWeight: "600" },
  mediaPreviewContainer: {
    borderRadius: 12,
    overflow: "hidden",
    height: 160,
    position: "relative",
  },
  mediaPreview: { width: "100%", height: "100%" },
  mediaPreviewOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  mediaReplaceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mediaReplaceBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  replaceMenu: {
    borderRadius: 12,
    padding: 6,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 120,
  },
  replaceMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  replaceMenuText: { fontSize: 13, fontWeight: "600" },
  addStepBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addStepText: { fontSize: 15, fontWeight: "600" },
});
