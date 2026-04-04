import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useColors } from "@/hooks/useColors";
import { useApp, apiBase } from "@/contexts/AppContext";
import { TagInput } from "@/components/TagInput";
import * as Haptics from "expo-haptics";

const STEPS = ["Basic Info", "Skills & Interests", "Goals"];

export default function CreateProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loadLearners, setCurrentLearner, refreshAll } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [therapies, setTherapies] = useState<string[]>([]);
  const [school, setSchool] = useState("");
  const [learnerClass, setLearnerClass] = useState("");

  // Step 2
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);

  // Step 3
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [longTermGoals, setLongTermGoals] = useState<string[]>([]);

  const canNext = () => {
    if (step === 0) return name.trim().length > 0 && birthday.trim().length > 0;
    if (step === 1) return true;
    if (step === 2) return true;
    return false;
  };

  const handleNext = () => {
    if (!canNext()) {
      Alert.alert("Required fields", "Please fill in name and birthday.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 2) setStep(step + 1);
    else handleSave();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase()}/learners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          birthday,
          diagnosis: diagnosis || null,
          therapies,
          school: school || null,
          class: learnerClass || null,
          capabilities,
          interests,
          favorites,
          challenges,
          learningGoals,
          longTermGoals,
        }),
      });
      if (!res.ok) throw new Error("Failed to create profile");
      const learner = await res.json();
      await loadLearners();
      await setCurrentLearner(learner);
      await refreshAll(learner.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", "Failed to create learner profile. Please try again.");
    }
    setSaving(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Learner Profile</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepRow}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: i <= step ? colors.primary : colors.muted,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, { backgroundColor: i < step ? colors.primary : colors.muted }]} />
            )}
          </View>
        ))}
      </View>
      <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </Text>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <View style={styles.formSection}>
            <InputField
              label="Child's Name *"
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              colors={colors}
            />
            <InputField
              label="Birthday *"
              value={birthday}
              onChangeText={setBirthday}
              placeholder="YYYY-MM-DD"
              colors={colors}
            />
            <InputField
              label="Diagnosis"
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder="e.g. Autism Spectrum Disorder"
              colors={colors}
            />
            <TagInput label="Therapies" tags={therapies} onTagsChange={setTherapies} placeholder="e.g. ABA, Speech Therapy" />
            <InputField
              label="School"
              value={school}
              onChangeText={setSchool}
              placeholder="School name"
              colors={colors}
            />
            <InputField
              label="Class / Grade"
              value={learnerClass}
              onChangeText={setLearnerClass}
              placeholder="e.g. Grade 2"
              colors={colors}
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.formSection}>
            <TagInput label="Capabilities" tags={capabilities} onTagsChange={setCapabilities} placeholder="e.g. Follows simple instructions" />
            <TagInput label="Interests" tags={interests} onTagsChange={setInterests} placeholder="e.g. Dinosaurs, Minecraft" />
            <TagInput label="Favorites" tags={favorites} onTagsChange={setFavorites} placeholder="e.g. Blippi, Blue's Clues" />
            <TagInput label="Challenges" tags={challenges} onTagsChange={setChallenges} placeholder="e.g. Transitions, loud noises" />
          </View>
        )}

        {step === 2 && (
          <View style={styles.formSection}>
            <TagInput label="Learning Goals" tags={learningGoals} onTagsChange={setLearningGoals} placeholder="e.g. Brush teeth independently" />
            <TagInput label="Long-Term Goals" tags={longTermGoals} onTagsChange={setLongTermGoals} placeholder="e.g. Live independently" />
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Bottom Buttons */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: bottomInset + 16, backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        {step > 0 && (
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep(step - 1);
            }}
          >
            <Text style={[styles.backBtnText, { color: colors.foreground }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary, flex: step > 0 ? 1 : undefined }]}
          onPress={handleNext}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
              {step === 2 ? "Create Profile" : "Continue"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={inputStyles.container}>
      <Text style={[inputStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[inputStyles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", letterSpacing: 0.4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  stepRow: { flexDirection: "row", alignItems: "center" },
  stepDot: { height: 8, borderRadius: 4 },
  stepLine: { width: 40, height: 2, marginHorizontal: 4 },
  stepLabel: { fontSize: 13, fontWeight: "500", paddingHorizontal: 24, marginBottom: 16 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 20 },
  formSection: { gap: 18 },
  bottomBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontSize: 16, fontWeight: "600" },
  nextBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  nextBtnText: { fontSize: 16, fontWeight: "700" },
});
