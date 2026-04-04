import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

const { width: SW } = Dimensions.get("window");

/* ── helpers ──────────────────────────────────────────── */
function pad(n: number) { return n.toString().padStart(2, "0"); }

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAY_LABELS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

function buildDays(year: number, month: number) {
  const first = new Date(year, month, 1).getDay(); // 0=Sun
  const startOffset = (first + 6) % 7; // Mon-based
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(d);
  return cells;
}

function buildNextDates(from: Date, count = 4) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    return d;
  });
}

const DAYS_SHORT_3 = ["Fr","Sa","Su","Mo","Tu","We","Th"];
const DAY_NAMES_FULL = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatDateFull(d: Date) {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* ── Categories ──────────────────────────────────────── */
const CATEGORIES = [
  { label: "Class",    color: "#F97316" },
  { label: "Therapy",  color: "#8B5CF6" },
  { label: "Grocery",  color: "#EF4444" },
  { label: "Other",    color: "#374151" },
  { label: "Leisure",  color: "#10B981" },
];

/* ── CalendarModal ────────────────────────────────────── */
function CalendarModal({
  visible, selectedDate, onSelect, onClose,
}: {
  visible: boolean;
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const today  = new Date();
  const [viewYear,  setViewYear]  = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const cells = buildDays(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.calOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[styles.calCard, { backgroundColor: "#fff" }]} activeOpacity={1}>
          {/* Close */}
          <TouchableOpacity style={styles.calClose} onPress={onClose}>
            <Ionicons name="close" size={18} color="#374151" />
          </TouchableOpacity>

          {/* Month nav */}
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={prevMonth}>
              <Ionicons name="chevron-back" size={18} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.calMonthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.calDayHeaders}>
            {DAY_LABELS.map(d => (
              <Text key={d} style={styles.calDayHeader}>{d}</Text>
            ))}
          </View>

          {/* Date grid */}
          <View style={styles.calGrid}>
            {cells.map((cell, i) => {
              if (!cell) return <View key={i} style={styles.calCell} />;
              const isToday    = cell === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              const isSelected = cell === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.calCell, isSelected && { backgroundColor: colors.primary, borderRadius: 20 }]}
                  onPress={() => {
                    const picked = new Date(viewYear, viewMonth, cell);
                    onSelect(picked);
                    onClose();
                  }}
                >
                  <Text style={[styles.calCellText,
                    isSelected && { color: "#fff", fontWeight: "800" },
                    isToday && !isSelected && { color: colors.primary, fontWeight: "700" },
                  ]}>
                    {cell}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ── DurationModal ────────────────────────────────────── */
function DurationModal({
  visible, startDate, endDate, fromHour, toHour,
  onSave, onClose,
}: {
  visible: boolean;
  startDate: Date;
  endDate: Date;
  fromHour: number;
  toHour: number;
  onSave: (startDate: Date, endDate: Date, fromHour: number, toHour: number) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd,   setLocalEnd]   = useState(endDate);
  const [localFrom,  setLocalFrom]  = useState(fromHour);
  const [localTo,    setLocalTo]    = useState(toHour);
  const [calTarget,  setCalTarget]  = useState<"start" | "end" | null>(null);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.durOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[styles.durCard, { backgroundColor: "#fff" }]} activeOpacity={1}>
          {/* Close */}
          <TouchableOpacity style={styles.durClose} onPress={onClose}>
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>

          <Text style={[styles.durTitle, { color: colors.foreground }]}>Set the duration</Text>

          {/* Start Date */}
          <TouchableOpacity
            style={[styles.durField, { borderColor: colors.primary }]}
            onPress={() => { Haptics.selectionAsync(); setCalTarget("start"); }}
          >
            <Text style={styles.durFieldLabel}>Start Date</Text>
            <Text style={[styles.durFieldValue, { color: colors.foreground }]}>
              {formatDateFull(localStart)}
            </Text>
          </TouchableOpacity>

          {/* End Date */}
          <TouchableOpacity
            style={[styles.durField, { borderColor: colors.primary }]}
            onPress={() => { Haptics.selectionAsync(); setCalTarget("end"); }}
          >
            <Text style={styles.durFieldLabel}>End Date</Text>
            <Text style={[styles.durFieldValue, { color: colors.foreground }]}>
              {formatDateFull(localEnd)}
            </Text>
          </TouchableOpacity>

          {/* Set the time */}
          <Text style={[styles.durSubTitle, { color: colors.foreground }]}>Set the time</Text>
          <View style={[styles.durTimeRow, { borderColor: colors.border }]}>
            <View style={styles.durTimeBlock}>
              <Text style={styles.durTimeSmall}>From</Text>
              <TouchableOpacity onPress={() => setLocalFrom(h => (h - 1 + 24) % 24)}>
                <Text style={[styles.durTimeBig, { color: colors.foreground }]}>{pad(localFrom)}.00</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            <View style={styles.durTimeBlock}>
              <Text style={styles.durTimeSmall}>To</Text>
              <TouchableOpacity onPress={() => setLocalTo(h => (h + 1) % 24)}>
                <Text style={[styles.durTimeBig, { color: colors.foreground }]}>{pad(localTo)}.00</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.durSaveBtn, { backgroundColor: colors.primary }]}
            onPress={() => { onSave(localStart, localEnd, localFrom, localTo); onClose(); }}
          >
            <Text style={styles.durSaveBtnText}>Save</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Calendar nested inside duration modal */}
      <CalendarModal
        visible={calTarget !== null}
        selectedDate={calTarget === "start" ? localStart : localEnd}
        onSelect={(d) => {
          if (calTarget === "start") setLocalStart(d);
          else setLocalEnd(d);
          setCalTarget(null);
        }}
        onClose={() => setCalTarget(null)}
      />
    </Modal>
  );
}

/* ── Add Schedule Screen ──────────────────────────────── */
export default function AddScheduleScreen() {
  const colors = useColors();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const topInset    = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const today = new Date();
  const dateStrip = buildNextDates(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), 4);

  const [title,           setTitle]         = useState("");
  const [selectedDate,    setSelectedDate]  = useState(dateStrip[1]);
  const [fromHour,        setFromHour]      = useState(12);
  const [toHour,          setToHour]        = useState(14);
  const [startDate,       setStartDate]     = useState(today);
  const [endDate,         setEndDate]       = useState(today);
  const [activeCategory,  setActiveCategory] = useState<string | null>(null);
  const [notes,           setNotes]         = useState("");
  const [shareChild,      setShareChild]    = useState(true);
  const [showDuration,    setShowDuration]  = useState(false);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: "#fff" }]}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Scheduler</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.formContent, { paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Title input ──────────────────────────────── */}
        <TextInput
          style={[styles.titleInput, { borderColor: colors.primary, color: colors.foreground }]}
          placeholder="Add a title"
          placeholderTextColor={colors.primary}
          value={title}
          onChangeText={setTitle}
        />

        {/* ── Select the date ──────────────────────────── */}
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Select the date</Text>
        <View style={styles.dateStrip}>
          {dateStrip.map((d, i) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            const dayLabel   = ["Fr","Sa","Su","Mo","Tu","We","Th"][d.getDay() === 0 ? 6 : d.getDay() - 1];
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dateChip,
                  { backgroundColor: isSelected ? colors.primary : colors.muted, borderRadius: 14 },
                ]}
                onPress={() => { Haptics.selectionAsync(); setSelectedDate(d); }}
              >
                <Text style={[styles.dateChipNum, { color: isSelected ? "#fff" : colors.foreground }]}>
                  {d.getDate()}
                </Text>
                <Text style={[styles.dateChipDay, { color: isSelected ? "rgba(255,255,255,0.85)" : colors.mutedForeground }]}>
                  {dayLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.dateChip, { backgroundColor: colors.muted, borderRadius: 14 }]}>
            <Text style={[styles.dateChipMore, { color: colors.mutedForeground }]}>More</Text>
          </TouchableOpacity>
        </View>

        {/* ── Select the time ──────────────────────────── */}
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Select the time</Text>
        <TouchableOpacity
          style={[styles.timeRow, { borderColor: colors.border, backgroundColor: colors.muted }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDuration(true); }}
        >
          <View style={styles.timeBlock}>
            <Text style={[styles.timeSmall, { color: colors.mutedForeground }]}>From</Text>
            <Text style={[styles.timeBig, { color: colors.foreground }]}>{pad(fromHour)}.00</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          <View style={styles.timeBlock}>
            <Text style={[styles.timeSmall, { color: colors.mutedForeground }]}>To</Text>
            <Text style={[styles.timeBig, { color: colors.foreground }]}>{pad(toHour)}.00</Text>
          </View>
        </TouchableOpacity>

        {/* ── Recurring ────────────────────────────────── */}
        <TouchableOpacity onPress={() => Haptics.selectionAsync()}>
          <Text style={[styles.recurringLink, { color: colors.primary }]}>Set as recurring?</Text>
        </TouchableOpacity>

        {/* ── Category ─────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
        <View style={styles.categoryWrap}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={styles.categoryItem}
              onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat.label); }}
            >
              <View style={[
                styles.categoryDot,
                { backgroundColor: cat.color, borderWidth: activeCategory === cat.label ? 2.5 : 0, borderColor: "#1E293B" },
              ]} />
              <Text style={[styles.categoryLabel, { color: colors.foreground, fontWeight: activeCategory === cat.label ? "700" : "400" }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.categoryItem}>
            <View style={[styles.categoryDotOutline, { borderColor: colors.border }]}>
              <Ionicons name="add" size={14} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Add Media ────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Add Media</Text>
        <View style={styles.mediaRow}>
          <TouchableOpacity style={[styles.mediaBtn, { backgroundColor: colors.primary }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Ionicons name="camera-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mediaBtn, { backgroundColor: colors.primary }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Ionicons name="videocam-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Notes ────────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Notes</Text>
        <TextInput
          style={[styles.notesInput, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />

        {/* ── Share to child's calendar? ───────────────── */}
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Share to child's calendar?</Text>
        <View style={styles.radioGroup}>
          {[true, false].map((val) => (
            <TouchableOpacity
              key={String(val)}
              style={styles.radioRow}
              onPress={() => { Haptics.selectionAsync(); setShareChild(val); }}
            >
              <View style={[styles.radioOuter, { borderColor: colors.primary }]}>
                {shareChild === val && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: colors.foreground }]}>{val ? "Yes" : "No"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Save button ──────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <DurationModal
        visible={showDuration}
        startDate={startDate}
        endDate={endDate}
        fromHour={fromHour}
        toHour={toHour}
        onSave={(sd, ed, fh, th) => { setStartDate(sd); setEndDate(ed); setFromHour(fh); setToHour(th); }}
        onClose={() => setShowDuration(false)}
      />
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  formContent: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },

  titleInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "500",
  },
  fieldLabel: { fontSize: 17, fontWeight: "700" },

  /* Date strip */
  dateStrip: { flexDirection: "row", gap: 10 },
  dateChip: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 4 },
  dateChipNum: { fontSize: 18, fontWeight: "800" },
  dateChipDay: { fontSize: 12, fontWeight: "500" },
  dateChipMore: { fontSize: 13, fontWeight: "600", paddingVertical: 4 },

  /* Time selector */
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  timeBlock: { alignItems: "center", gap: 2 },
  timeSmall: { fontSize: 12, fontWeight: "500" },
  timeBig: { fontSize: 28, fontWeight: "800" },

  recurringLink: { fontSize: 14, fontWeight: "600" },

  /* Categories */
  categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  categoryItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  categoryDot: { width: 14, height: 14, borderRadius: 7 },
  categoryDotOutline: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: { fontSize: 14 },

  /* Media */
  mediaRow: { flexDirection: "row", gap: 12 },
  mediaBtn: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Notes */
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    minHeight: 100,
  },

  /* Radio */
  radioGroup: { gap: 12 },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 11, height: 11, borderRadius: 6 },
  radioLabel: { fontSize: 16 },

  /* Save */
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  /* Duration modal */
  durOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  durCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  durClose: { position: "absolute", right: 16, top: 16 },
  durTitle: { fontSize: 20, fontWeight: "800" },
  durField: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  durFieldLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  durFieldValue: { fontSize: 15, fontWeight: "600" },
  durSubTitle: { fontSize: 17, fontWeight: "700" },
  durTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  durTimeBlock: { alignItems: "center", gap: 2 },
  durTimeSmall: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  durTimeBig: { fontSize: 28, fontWeight: "800" },
  durSaveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  durSaveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  /* Calendar modal */
  calOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  calCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  calClose: { position: "absolute", right: 14, top: 14 },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  calMonthLabel: { fontSize: 15, fontWeight: "700", color: "#2F80ED" },
  calDayHeaders: { flexDirection: "row", marginBottom: 6 },
  calDayHeader: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "700", color: "#9CA3AF" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  calCellText: { fontSize: 13, color: "#374151" },
});
