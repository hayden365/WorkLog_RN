/**
 * HomeScreen — the WorkLog home, translated from the Claude Design mockup and
 * wired to the app's real stores. Uses our design tokens and the `brand`
 * palette. Owns its own branded header (the native stack header is hidden in
 * App.tsx), so the gear opens Settings from here.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { format } from 'date-fns';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize, fontWeight } from '../theme/tokens';
import { useDateStore } from '../store/dateStore';
import {
  useDateScheduleStore,
  useCalendarDisplayStore,
  useShiftStore,
} from '../store/shiftStore';
import { useScheduleManager } from '../hooks/useScheduleManager';
import { generateViewMonthScheduleData } from '../utils/calendarfns';
import { displayMonthlyWage } from '../utils/wageFns';
import { formatNumberWithComma } from '../utils/formatNumbs';
import { WorkSession } from '../models/WorkSession';
import { NewSessionModal } from '../components/NewSessionModal';
import ScheduleModal from '../components/ScheduleModal';
import { SettingsModal } from '../components/SettingsModal';
import { AdBanner } from '../components/AdBanner';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const WD_KO = ['일', '월', '화', '수', '목', '금', '토'];

/** Worked hours for one session, wrapping past midnight (mirrors calculateDailyWage). */
function sessionHours(s: WorkSession): number {
  const start = s.startTime.getHours() * 60 + s.startTime.getMinutes();
  const end = s.endTime.getHours() * 60 + s.endTime.getMinutes();
  let mins = end - start;
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

/** 104000 → "104k"; 0/undefined → "". */
function formatK(n: number): string {
  if (!n) return '';
  return `${Math.round(n / 1000)}k`;
}

type Cell = { label: number; inMonth: boolean; key: string; col: number };

/** Monday-first month grid for (year, month), with leading/trailing days. */
function buildGrid(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Mon-first leading count
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const total = Math.ceil((offset + daysInMonth) / 7) * 7;

  const cells: Cell[] = [];
  for (let i = 0; i < total; i++) {
    const dayNum = i - offset + 1;
    const col = i % 7;
    if (dayNum < 1) {
      cells.push({
        label: prevMonthDays + dayNum,
        inMonth: false,
        key: '',
        col,
      });
    } else if (dayNum > daysInMonth) {
      cells.push({ label: dayNum - daysInMonth, inMonth: false, key: '', col });
    } else {
      cells.push({
        label: dayNum,
        inMonth: true,
        key: format(new Date(year, month, dayNum), 'yyyy-MM-dd'),
        col,
      });
    }
  }
  return cells;
}

const HomeScreen = () => {
  const { colors } = useTheme();
  const { reset } = useShiftStore();
  const { allSchedulesById, addSchedule, getAllSchedules } =
    useScheduleManager();
  const { dateSchedule, setDateSchedule } = useDateScheduleStore();
  const { setCalendarDisplay, calendarDisplayMap } = useCalendarDisplayStore();
  const { year, month, setYearMonth } = useDateStore();

  // Move the calendar by ±1 month, rolling the year over at the boundaries.
  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYearMonth(next.getFullYear(), next.getMonth());
  };

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd'),
  );
  const [earnings, setEarnings] = useState(0);
  const [prevEarnings, setPrevEarnings] = useState(0);
  const [amountVisible, setAmountVisible] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | undefined>(
    undefined,
  );
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);

  // Rebuild the view-month calendar + earnings whenever schedules or month change.
  useEffect(() => {
    const all = getAllSchedules();
    const viewMonth = new Date(year, month, 1);
    const { markedDates, dateSchedule: byDate } = generateViewMonthScheduleData(
      all,
      viewMonth,
    );
    setDateSchedule(byDate);
    setCalendarDisplay(markedDates);
    setEarnings(displayMonthlyWage(byDate, allSchedulesById, viewMonth));

    const prevMonth = new Date(year, month - 1, 1);
    const { dateSchedule: prevByDate } = generateViewMonthScheduleData(
      all,
      prevMonth,
    );
    setPrevEarnings(
      displayMonthlyWage(prevByDate, allSchedulesById, prevMonth),
    );
  }, [allSchedulesById, year, month]);

  const grid = useMemo(() => buildGrid(year, month), [year, month]);
  const weeks: Cell[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  const todayKey = format(new Date(), 'yyyy-MM-dd');

  // Distinct (jobName, color) pairs shown this month — drives the calendar legend.
  const legend = useMemo(() => {
    const byJob = new Map<string, string>();
    Object.values(calendarDisplayMap).forEach((items) =>
      items.forEach((it) => {
        if (!byJob.has(it.jobName)) byJob.set(it.jobName, it.color);
      }),
    );
    return Array.from(byJob, ([jobName, color]) => ({ jobName, color }));
  }, [calendarDisplayMap]);

  // Sum of a day's daily wages (monthly-type jobs have null daily wage → skipped).
  const dayWage = (key: string) =>
    (dateSchedule[key] ?? []).reduce(
      (sum, id) => sum + (allSchedulesById[id]?.calculatedDailyWage ?? 0),
      0,
    );

  const workDays = Object.keys(dateSchedule).length;
  const totalHours = Object.values(dateSchedule).reduce(
    (sum, ids) =>
      sum +
      ids.reduce(
        (h, id) =>
          h + (allSchedulesById[id] ? sessionHours(allSchedulesById[id]) : 0),
        0,
      ),
    0,
  );

  const selectedSessions = (dateSchedule[selectedDate] ?? [])
    .map((id) => allSchedulesById[id])
    .filter(Boolean) as WorkSession[];
  const selectedWage = dayWage(selectedDate);
  const selDate = new Date(selectedDate);

  const trendPct =
    prevEarnings > 0
      ? Math.round(((earnings - prevEarnings) / prevEarnings) * 100)
      : null;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.surface }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View
              style={[styles.logoMark, { backgroundColor: colors.brandStrong }]}
            >
              <Text style={[styles.logoText, { color: colors.accentText }]}>
                W
              </Text>
            </View>
            <Text style={[styles.brandName, { color: colors.textPrimary }]}>
              WorkLog
            </Text>
          </View>
          <TouchableOpacity
            hitSlop={8}
            onPress={() => setSettingsVisible(true)}
          >
            <Feather name='settings' size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Earnings card */}
        <View style={[styles.earnings, { backgroundColor: colors.brand }]}>
          <View style={styles.blob1} />
          <View style={styles.blob2} />
          <View style={styles.earningsTopRow}>
            <Text style={styles.earningsLabel}>{month + 1}월 예상 급여</Text>
            <TouchableOpacity
              hitSlop={8}
              onPress={() => setAmountVisible((v) => !v)}
            >
              <Feather
                name={amountVisible ? 'eye' : 'eye-off'}
                size={20}
                color='rgba(255,255,255,0.9)'
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsAmount}>
            {amountVisible
              ? `₩${formatNumberWithComma(String(earnings))}`
              : '₩ •••••••'}
          </Text>
          <View style={styles.earningsBottomRow}>
            <Text style={styles.earningsMeta}>
              근무 {workDays}일 · {Math.round(totalHours)}시간
            </Text>
            {trendPct !== null && (
              <View style={styles.trendPill}>
                <Feather
                  name={trendPct >= 0 ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.accentText}
                />
                <Text style={styles.trendText}>
                  지난달 {trendPct >= 0 ? '+' : ''}
                  {trendPct}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Calendar card */}
        <View
          style={[styles.card, { backgroundColor: colors.surfaceElevated }]}
        >
          <View style={styles.monthNav}>
            <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
              {year}년 {month + 1}월
            </Text>
            <View style={styles.monthNavButtons}>
              <TouchableOpacity
                hitSlop={8}
                style={[styles.monthNavButton, { backgroundColor: colors.surface }]}
                onPress={() => shiftMonth(-1)}
              >
                <Feather name='chevron-left' size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                hitSlop={8}
                style={[styles.monthNavButton, { backgroundColor: colors.surface }]}
                onPress={() => shiftMonth(1)}
              >
                <Feather name='chevron-right' size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekHeader}>
            {WEEKDAYS.map((w, i) => (
              <Text
                key={w}
                style={[
                  styles.weekHeaderCell,
                  {
                    color:
                      i === 5
                        ? colors.saturday
                        : i === 6
                        ? colors.sunday
                        : colors.textSecondary,
                  },
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((cell, ci) => {
                const dots = cell.inMonth
                  ? calendarDisplayMap[cell.key] ?? []
                  : [];
                const amount = cell.inMonth ? formatK(dayWage(cell.key)) : '';
                const isSelected = cell.inMonth && cell.key === selectedDate;
                const isToday = cell.inMonth && cell.key === todayKey;
                const numColor = !cell.inMonth
                  ? colors.calendarDisabled
                  : ci === 5
                  ? colors.saturday
                  : ci === 6
                  ? colors.sunday
                  : colors.textPrimary;
                return (
                  <TouchableOpacity
                    key={ci}
                    style={styles.dayCell}
                    activeOpacity={0.7}
                    disabled={!cell.inMonth}
                    onPress={() => cell.inMonth && setSelectedDate(cell.key)}
                  >
                    <View
                      style={[
                        styles.dayInner,
                        isSelected && { backgroundColor: colors.divider },
                      ]}
                    >
                      <View
                        style={[
                          styles.numWrap,
                          isToday && { backgroundColor: colors.brandStrong },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayNum,
                            {
                              color: isToday ? colors.accentText : numColor,
                            },
                          ]}
                        >
                          {cell.label}
                        </Text>
                      </View>
                      <View style={styles.dotsRow}>
                        {dots.slice(0, 3).map((d, di) => (
                          <View
                            key={di}
                            style={[styles.dot, { backgroundColor: d.color }]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.dayAmount, { color: colors.brand }]}>
                        {amount}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {legend.length > 0 && (
            <View style={[styles.legendRow, { borderTopColor: colors.divider }]}>
              {legend.map((l) => (
                <View key={l.jobName} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: l.color }]}
                  />
                  <Text
                    style={[styles.legendLabel, { color: colors.textSecondary }]}
                  >
                    {l.jobName}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Selected-day detail */}
        <View style={styles.detailHeader}>
          <Text style={[styles.detailDate, { color: colors.textPrimary }]}>
            {selDate.getMonth() + 1}월 {selDate.getDate()}일 (
            {WD_KO[selDate.getDay()]})
          </Text>
          {selectedWage > 0 && (
            <Text style={[styles.detailWage, { color: colors.brand }]}>
              일급{' '}
              <Text style={styles.detailWageAmount}>
                ₩{formatNumberWithComma(String(selectedWage))}
              </Text>
            </Text>
          )}
        </View>

        {selectedSessions.length === 0 ? (
          <View
            style={[
              styles.scheduleCard,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              일정이 없습니다
            </Text>
          </View>
        ) : (
          selectedSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              activeOpacity={0.8}
              onPress={() => setEditSessionId(session.id)}
              style={[
                styles.scheduleCard,
                { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <View
                style={[
                  styles.scheduleBar,
                  { backgroundColor: session.color || colors.brand },
                ]}
              />
              <View style={styles.scheduleBody}>
                <Text
                  style={[styles.scheduleTitle, { color: colors.textPrimary }]}
                >
                  {session.jobName}
                </Text>
                <Text
                  style={[styles.scheduleTime, { color: colors.textSecondary }]}
                >
                  {format(session.startTime, 'HH:mm')} –{' '}
                  {format(session.endTime, 'HH:mm')}
                  {'  ·  '}
                  {Math.round(sessionHours(session) * 10) / 10}시간
                </Text>
              </View>
              {session.calculatedDailyWage != null && (
                <Text
                  style={[styles.scheduleWage, { color: colors.textPrimary }]}
                >
                  ₩{formatNumberWithComma(String(session.calculatedDailyWage))}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View onLayout={(e) => setBannerHeight(e.nativeEvent.layout.height)}>
        <AdBanner />
      </View>

      {/* Floating add button — rendered after the banner so it paints on top */}
      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: bannerHeight + spacing.xl, backgroundColor: colors.brand },
        ]}
        activeOpacity={0.85}
        onPress={() => {
          reset();
          setCreateVisible(true);
        }}
      >
        <Feather name='plus' size={28} color={colors.accentText} />
      </TouchableOpacity>

      <NewSessionModal
        visible={createVisible}
        mode='create'
        onClose={() => setCreateVisible(false)}
        onSave={(s: Partial<WorkSession>) => addSchedule(s as WorkSession)}
      />
      <ScheduleModal
        visible={editSessionId !== undefined}
        onClose={() => setEditSessionId(undefined)}
        sessionId={editSessionId}
      />
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  brandName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },

  earnings: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  blob1: {
    position: 'absolute',
    right: -30,
    top: -20,
    width: 160,
    height: 160,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blob2: {
    position: 'absolute',
    right: 40,
    bottom: -50,
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  earningsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: 'rgba(255,255,255,0.85)',
  },
  earningsAmount: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: '#ffffff',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  earningsBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsMeta: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: fontWeight.medium,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  trendText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#ffffff',
  },

  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  monthTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  monthNavButtons: { flexDirection: 'row', gap: spacing.sm },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekHeader: { flexDirection: 'row', marginBottom: spacing.sm },
  weekHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  weekRow: { flexDirection: 'row' },
  dayCell: { flex: 1, alignItems: 'center' },
  dayInner: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    borderRadius: radius.md,
    minHeight: 58,
    width: 42,
  },
  numWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontSize: fontSize.md, fontWeight: fontWeight.medium },
  dotsRow: { flexDirection: 'row', height: 8, marginTop: spacing.xxs },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 1 },
  dayAmount: { fontSize: 10, fontWeight: fontWeight.semibold, marginTop: 1 },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  detailDate: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  detailWage: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  detailWageAmount: { fontWeight: fontWeight.bold },

  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  scheduleBar: { width: 4, alignSelf: 'stretch', borderRadius: radius.full },
  scheduleBody: { flex: 1, gap: spacing.xs },
  scheduleTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  scheduleTime: { fontSize: fontSize.sm },
  scheduleWage: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.md,
    fontStyle: 'italic',
  },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 10,
  },
});
