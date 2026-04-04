import React, { useState, useEffect } from "react";
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
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase, Adventure } from "@/contexts/AppContext";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

async function uploadImage(localUri: string): Promise<string> {
  const formData = new FormData();
  if (Platform.OS === "web") {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const mime = blob.type || "image/jpeg";
    formData.append("file", new Blob([blob], { type: mime }), "reward.jpg");
  } else {
    (formData as any).append("file", { uri: localUri, name: "reward.jpg", type: "image/jpeg" });
  }
  const res = await fetch(`${apiBase()}/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return ((await res.json()) as { url: string }).url;
}

type Step = 1 | 2 | 3;

export default function CreateRewardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLearner, loadRewards, adventures, loadAdventures } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Step 2: Conditions
  const [cost, setCost] = useState("20");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [linkedAdventureIds, setLinkedAdventureIds] = useState<number[]>([]);

  useEffect(() => {
    if (currentLearner) loadAdventures(currentLearner.id);
  }, [currentLearner?.id]);

  const pickImage = async (source: "gallery" | "camera") => {
    let result: ImagePicker.ImagePickerResult;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Camera access is required."); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [4, 3] });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Photo library access is required."); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [4, 3] });
    }
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const toggleAdventure = (id: number) => {
    setLinkedAdventureIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const validate = () => {
    if (step === 1) {
      if (!name.trim()) { Alert.alert("Required", "Please enter a reward name."); return false; }
      return true;
    }
    if (step === 2) {
      if (!cost.trim() || isNaN(parseInt(cost)) || parseInt(cost) < 1) {
        Alert.alert("Required", "Please enter a valid coin cost."); return false;
      }
      return true;
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  };

  const saveReward = async (isDraft: boolean) => {
    if (!currentLearner || !validate()) return;
    setSaving(true);
    try {
      // Upload image to server first so the URL is durable across sessions
      let finalImageUrl: string | null = null;
      if (imageUri) {
        try {
          finalImageUrl = await uploadImage(imageUri);
        } catch {
          // Non-fatal: fall back to local URI for this session
          finalImageUrl = imageUri;
        }
      }

      const body: any = {
        learnerId: currentLearner.id,
        name: name.trim(),
        description: description.trim() || null,
        imageUrl: finalImageUrl,
        cost: parseInt(cost) || 20,
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,
        timeWindow: timeWindow.trim() || null,
        linkedAdventures: linkedAdventureIds,
        isDraft,
        isPublished: !isDraft,
      };
      const res = await fetch(`${apiBase()}/rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      await loadRewards(currentLearner.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (!isDraft) {
        Alert.alert("Published!", `"${name}" is now live for ${currentLearner.name}.`, [
          { text: "Done", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Saved as Draft", "You can publish it from the Rewards tab.", [
          { text: "Done", onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert("Error", "Failed to save reward.");
    }
    setSaving(false);
  };

  if (!currentLearner) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[{ color: colors.mutedForeground, fontSize: 15 }]}>Select a learner first</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep((s) => (s - 1) as Step) : router.back())}>
          {step > 1 ? (
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          ) : (
            <Ionicons name="close" size={24} color={colors.foreground} />
          )}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create a reward</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {([1, 2, 3] as Step[]).map((s) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              { backgroundColor: s <= step ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 120 }]}>
        {step === 1 && (
          <>
            <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 1 of 3 — Basic Info</Text>

            {/* Image picker */}
            <TouchableOpacity
              style={[styles.imagePicker, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={() => Alert.alert("Add Image", "Choose source:", [
                { text: "Gallery", onPress: () => pickImage("gallery") },
                { text: "Camera", onPress: () => pickImage("camera") },
                { text: "Cancel", style: "cancel" },
              ])}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.imagePlaceholderText, { color: colors.mutedForeground }]}>
                    Add a photo
                  </Text>
                </View>
              )}
              {imageUri && (
                <View style={styles.imageReplaceOverlay}>
                  <Ionicons name="camera" size={18} color="#fff" />
                  <Text style={styles.imageReplaceText}>Replace</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Reward name *</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Trip to Jamba Juice"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Description</Text>
              <TextInput
                style={[styles.fieldInput, styles.multiline, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe this reward..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
              />
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 2 of 3 — Conditions</Text>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Coins needed *</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                value={cost}
                onChangeText={setCost}
                keyboardType="number-pad"
                placeholder="20"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.dateRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Start date</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="e.g. 2024-05-28"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>End date</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="e.g. 2024-06-28"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Time window</Text>
              <TextInput
                style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                value={timeWindow}
                onChangeText={setTimeWindow}
                placeholder="e.g. 7:00 AM – 9:00 AM"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {adventures.length > 0 && (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Link to adventures</Text>
                <Text style={[styles.fieldSub, { color: colors.mutedForeground }]}>
                  Reward is only available after completing linked adventures
                </Text>
                {adventures.map((adv) => (
                  <TouchableOpacity
                    key={adv.id}
                    style={[
                      styles.adventureToggle,
                      {
                        backgroundColor: linkedAdventureIds.includes(adv.id) ? colors.secondary : colors.card,
                        borderColor: linkedAdventureIds.includes(adv.id) ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => toggleAdventure(adv.id)}
                  >
                    <Ionicons
                      name={linkedAdventureIds.includes(adv.id) ? "checkbox" : "square-outline"}
                      size={20}
                      color={linkedAdventureIds.includes(adv.id) ? colors.primary : colors.mutedForeground}
                    />
                    <Text style={[styles.adventureToggleText, { color: colors.foreground }]} numberOfLines={1}>
                      {adv.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 3 of 3 — Review & Save</Text>

            <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.reviewImage} contentFit="cover" />
              )}
              <View style={styles.reviewBody}>
                <Text style={[styles.reviewName, { color: colors.foreground }]}>{name}</Text>
                {description ? (
                  <Text style={[styles.reviewDesc, { color: colors.mutedForeground }]}>{description}</Text>
                ) : null}
                <View style={styles.reviewMeta}>
                  <View style={[styles.reviewMetaItem, { backgroundColor: colors.coinBg }]}>
                    <Ionicons name="star" size={14} color={colors.coin} />
                    <Text style={[styles.reviewMetaText, { color: colors.coin }]}>{cost} coins</Text>
                  </View>
                  {startDate ? (
                    <View style={[styles.reviewMetaItem, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                      <Text style={[styles.reviewMetaText, { color: colors.primary }]}>{startDate}</Text>
                    </View>
                  ) : null}
                  {timeWindow ? (
                    <View style={[styles.reviewMetaItem, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="time-outline" size={14} color={colors.primary} />
                      <Text style={[styles.reviewMetaText, { color: colors.primary }]}>{timeWindow}</Text>
                    </View>
                  ) : null}
                </View>
                {linkedAdventureIds.length > 0 && (
                  <Text style={[styles.reviewLink, { color: colors.mutedForeground }]}>
                    Linked to {linkedAdventureIds.length} adventure{linkedAdventureIds.length > 1 ? "s" : ""}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.secondary }]}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                Publishing makes this reward visible to {currentLearner.name}. Save as draft to finish setting it up later.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 8, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {step < 3 ? (
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={next}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.saveRow}>
            <TouchableOpacity
              style={[styles.draftBtn, { borderColor: colors.border }]}
              onPress={() => saveReward(true)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.draftBtnText, { color: colors.foreground }]}>Save as draft</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.publishBtn, { backgroundColor: colors.primary }]}
              onPress={() => saveReward(false)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.publishBtnText}>Publish</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  stepIndicator: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  stepDot: { height: 4, flex: 1, borderRadius: 2 },
  content: { paddingHorizontal: 20, gap: 18, paddingTop: 4 },
  stepLabel: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
  imagePicker: {
    borderRadius: 16,
    borderWidth: 1,
    height: 180,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePlaceholderText: { fontSize: 14, fontWeight: "500" },
  imageReplaceOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageReplaceText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
  fieldSub: { fontSize: 12, marginTop: -3 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  dateRow: { flexDirection: "row", gap: 12 },
  adventureToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  adventureToggleText: { flex: 1, fontSize: 14, fontWeight: "600" },
  reviewCard: { borderRadius: 16, overflow: "hidden" },
  reviewImage: { width: "100%", height: 180 },
  reviewBody: { padding: 16, gap: 8 },
  reviewName: { fontSize: 20, fontWeight: "800" },
  reviewDesc: { fontSize: 14, lineHeight: 20 },
  reviewMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reviewMetaItem: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  reviewMetaText: { fontSize: 12, fontWeight: "700" },
  reviewLink: { fontSize: 12 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  saveRow: { flexDirection: "row", gap: 12 },
  draftBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  draftBtnText: { fontSize: 15, fontWeight: "700" },
  publishBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  publishBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
