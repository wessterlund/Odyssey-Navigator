import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";

const DAYS_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const DAYS_FULL  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildWeek(anchorDate: Date) {
  const day = anchorDate.getDay(); // 0=Sun
  const monday = new Date(anchorDate);
  monday.setDate(anchorDate.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const TODAY = new Date();
const WEEK  = buildWeek(TODAY);

// startHour/endHour mapped to 2-hour slot positions (slot 0 = 08:00, slot 1 = 10:00 …)
const SCHEDULE_EVENTS = [
  { id: 1, title: "Trip to the grocery",  startSlot: 0, endSlot: 1, avatars: ["👩", "👧"] },
  { id: 2, title: "Lunch with Auntie Tess and go to the mall to shop for school supplies", startSlot: 2, endSlot: 3.5, avatars: ["👩", "🧒"] },
];

const REMINDERS = [
  { id: 1, title: "Speech therapy with Dr. Basa", time: "10:00 - 11:00 AM" },
  { id: 2, title: "Regular Class",                time: "1:00 - 4:00 PM"  },
];

const TIME_SLOTS = [8, 10, 12, 14, 16];

function pad(n: number) { return n.toString().padStart(2, "0"); }

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function SchedulerScreen() {
  const colors = useColors();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { currentLearner } = useApp();

  const topInset    = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedDate, setSelectedDate] = useState(TODAY);

  const firstName = currentLearner?.name.split(" ")[0] ?? "Lyn";

  return (
    <View style={[styles.root, { backgroundColor: "#fff" }]}>
      {/* ── Header ───────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Scheduler</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ─────────────────────────────────── */}
        <Text style={[styles.greeting, { color: colors.foreground }]}>
          {getGreeting()}, {firstName}
        </Text>

        {/* ── Add a Schedule button ─────────────────────── */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/scheduler/add");
          }}
        >
          <Text style={styles.addBtnText}>Add a Schedule</Text>
        </TouchableOpacity>

        {/* ── Weekly date strip ─────────────────────────── */}
        <View style={styles.weekStrip}>
          {WEEK.map((day, idx) => {
            const isToday    = day.toDateString() === TODAY.toDateString();
            const isSelected = day.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={idx}
                style={styles.dayBtn}
                onPress={() => { Haptics.selectionAsync(); setSelectedDate(day); }}
              >
                <Text style={[styles.dayNum, isSelected && styles.dayNumSelected, { color: isSelected ? "#fff" : colors.foreground }]}>
                  {day.getDate()}
                </Text>
                <Text style={[styles.dayLabel, { color: isSelected ? colors.primary : colors.mutedForeground }]}>
                  {DAYS_SHORT[idx]}
                </Text>
                {isToday && <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />}
                {isSelected && <View style={[styles.selectedCircle, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.addDayBtn, { backgroundColor: colors.primary }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Schedule for Today ────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Schedule for Today</Text>

        <View style={styles.timelineWrap}>
          {/* Time markers */}
          <View style={styles.timeMarkers}>
            {TIME_SLOTS.map((h) => (
              <View key={h} style={styles.timeSlot}>
                <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>{pad(h)}:00</Text>
                <View style={[styles.timeLine, { backgroundColor: colors.border }]} />
              </View>
            ))}
          </View>

          {/* Events */}
          <View style={styles.eventsCol}>
            {SCHEDULE_EVENTS.map((evt) => {
              const SLOT_H    = 52; // matches each timeSlot height
              const topOffset = evt.startSlot * SLOT_H;
              const height    = (evt.endSlot - evt.startSlot) * SLOT_H;
              return (
                <TouchableOpacity
                  key={evt.id}
                  style={[
                    styles.eventCard,
                    { backgroundColor: colors.primary, top: topOffset, height: Math.max(height, 52) },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <Text style={styles.eventTitle} numberOfLines={3}>{evt.title}</Text>
                  <View style={styles.eventAvatars}>
                    {evt.avatars.map((a, i) => (
                      <Text key={i} style={styles.eventAvatar}>{a}</Text>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Reminder ──────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reminder</Text>
        <Text style={[styles.reminderSub, { color: colors.mutedForeground }]}>
          Don't forget your appointments for tomorrow
        </Text>

        <View style={styles.remindersCol}>
          {REMINDERS.map((rem) => (
            <TouchableOpacity
              key={rem.id}
              style={[styles.reminderCard, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={styles.reminderIcon}>
                <Ionicons name="calendar-outline" size={22} color="#fff" />
              </View>
              <View style={styles.reminderText}>
                <Text style={styles.reminderTitle}>{rem.title}</Text>
                <View style={styles.reminderTimeRow}>
                  <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.reminderTime}>{rem.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 20 },

  greeting: { fontSize: 22, fontWeight: "700" },

  addBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  addBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  /* Week strip */
  weekStrip: { flexDirection: "row", alignItems: "center", gap: 4 },
  dayBtn: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 4, position: "relative" },
  selectedCircle: {
    position: "absolute",
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    zIndex: -1,
  },
  dayNum: { fontSize: 15, fontWeight: "700", zIndex: 1, lineHeight: 32, textAlign: "center" },
  dayNumSelected: { color: "#fff" },
  dayLabel: { fontSize: 11, fontWeight: "500" },
  todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  addDayBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: -8 },

  /* Timeline */
  timelineWrap: { flexDirection: "row", gap: 10, height: 260 },
  timeMarkers: { width: 46, gap: 0 },
  timeSlot: {
    height: 52,
    justifyContent: "flex-start",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  timeLabel: { fontSize: 11, width: 36, textAlign: "right", paddingTop: 2 },
  timeLine: { flex: 1, height: 1, marginTop: 8 },
  eventsCol: { flex: 1, position: "relative" },
  eventCard: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  eventTitle: { flex: 1, fontSize: 13, fontWeight: "600", color: "#fff", lineHeight: 18 },
  eventAvatars: { flexDirection: "row", gap: 2 },
  eventAvatar: { fontSize: 16 },

  /* Reminders */
  reminderSub: { fontSize: 14, marginTop: -12 },
  remindersCol: { gap: 10 },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderText: { gap: 4 },
  reminderTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  reminderTimeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  reminderTime: { fontSize: 12, color: "rgba(255,255,255,0.85)" },
});
