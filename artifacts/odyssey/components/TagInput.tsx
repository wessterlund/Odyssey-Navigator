import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface TagInputProps {
  label: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ label, tags, onTagsChange, placeholder }: TagInputProps) {
  const colors = useColors();
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder || `Add ${label.toLowerCase()}...`}
          placeholderTextColor={colors.mutedForeground}
          onSubmitEditing={addTag}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={addTag} style={styles.addBtn}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, { backgroundColor: colors.secondary }]}
              onPress={() => removeTag(tag)}
            >
              <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              <Ionicons name="close" size={14} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 13, fontWeight: "600", letterSpacing: 0.5 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 4,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
  addBtn: { padding: 6 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: { fontSize: 13, fontWeight: "600" },
});
