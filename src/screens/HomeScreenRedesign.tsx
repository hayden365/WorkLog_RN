/**
 * HomeScreenRedesign — a faithful RN translation of the Claude Design mockup,
 * built entirely from our design tokens (src/theme/tokens) and semantic colors
 * (src/theme/colors, incl. the new `brand` green).
 *
 * Presentational only: it renders mock data and is not wired to the app's
 * stores or navigation, so it doesn't touch the working HomeScreen. To preview
 * it, point a route at <HomeScreenRedesign /> (see the note in the chat).
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize, fontWeight } from '../theme/tokens';

// --- Mock data (would come from stores in the wired screen) --------------------

/** Workplace category colors — data, not theme tokens. */
const CATEGORY = {
  starbucks: { color: '#4e9280', label: '스타벅스' },
  gs25: { color: '#e6a23d', label: 'GS25' },
  tutoring: { color: '#9b7ede', label: '과외' },
} as const;

type Category = keyof typeof CATEGORY;

type DayMark = { dots: Category[]; amount: string };

/** July 2026 marks, keyed by day-of-month (matches the mockup). */
const MARKS: Record<number, DayMark> = {
  1: { dots: ['starbucks'], amount: '60k' },
  2: { dots: ['gs25'], amount: '44k' },
  3: { dots: ['starbucks'], amount: '72k' },
  6: { dots: ['starbucks', 'gs25'], amount: '104k' },
  8: { dots: ['starbucks'], amount: '60k' },
  9: { dots: ['tutoring'], amount: '80k' },
  10: { dots: ['starbucks'], amount: '72k' },
  13: { dots: ['starbucks'], amount: '60k' },
  15: { dots: ['gs25'], amount: '55k' },
  16: { dots: ['starbucks'], amount: '60k' },
  17: { dots: ['tutoring'], amount: '80k' },
  20: { dots: ['starbucks'], amount: '60k' },
  22: { dots: ['starbucks'], amount: '72k' },
  24: { dots: ['gs25'], amount: '44k' },
  27: { dots: ['starbucks'], amount: '60k' },
  29: { dots: ['tutoring'], amount: '80k' },
};

const TODAY = 6; // light pill highlight
const SELECTED = 7; // filled circle

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

/**
 * Month grid, Monday-first. July 2026 starts on a Wednesday (index 2), so two
 * trailing June days lead, and two August days trail — five weeks, as drawn.
 */
type Cell = { day: number; inMonth: boolean };
function buildGrid(): Cell[] {
  const cells: Cell[] = [];
  for (let d = 29; d <= 30; d++) cells.push({ day: d, inMonth: false }); // Jun 29–30
  for (let d = 1; d <= 31; d++) cells.push({ day: d, inMonth: true }); // Jul 1–31
  for (let d = 1; d <= 2; d++) cells.push({ day: d, inMonth: false }); // Aug 1–2
  return cells;
}

// --- Screen -------------------------------------------------------------------

export default function HomeScreenRedesign() {
  const { colors } = useTheme();
  const grid = buildGrid();
  const weeks: Cell[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.surface }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={[styles.logoMark, { backgroundColor: colors.brandStrong }]}>
              <Text style={[styles.logoText, { color: colors.accentText }]}>W</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.textPrimary }]}>
              WorkLog
            </Text>
          </View>
          <TouchableOpacity hitSlop={8}>
            <Feather name="settings" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Earnings card */}
        <View style={[styles.earnings, { backgroundColor: colors.brand }]}>
          <View style={styles.blob1} />
          <View style={styles.blob2} />
          <View style={styles.earningsTopRow}>
            <Text style={styles.earningsLabel}>7월 예상 급여</Text>
            <Feather name="eye" size={20} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.earningsAmount}>₩1,284,000</Text>
          <View style={styles.earningsBottomRow}>
            <Text style={styles.earningsMeta}>근무 14일  ·  96시간</Text>
            <View style={styles.trendPill}>
              <Feather name="chevron-up" size={14} color={colors.accentText} />
              <Text style={styles.trendText}>지난달 +12%</Text>
            </View>
          </View>
        </View>

        {/* Calendar card */}
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
            2026년 7월
          </Text>

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
                const mark = cell.inMonth ? MARKS[cell.day] : undefined;
                const isSelected = cell.inMonth && cell.day === SELECTED;
                const isToday = cell.inMonth && cell.day === TODAY;
                const numColor = !cell.inMonth
                  ? colors.calendarDisabled
                  : ci === 5
                  ? colors.saturday
                  : ci === 6
                  ? colors.sunday
                  : colors.textPrimary;
                return (
                  <TouchableOpacity key={ci} style={styles.dayCell} activeOpacity={0.7}>
                    <View
                      style={[
                        styles.dayInner,
                        isToday && {
                          backgroundColor: 'rgba(78,146,128,0.14)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.numWrap,
                          isSelected && { backgroundColor: colors.brandStrong },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayNum,
                            { color: isSelected ? colors.accentText : numColor },
                          ]}
                        >
                          {cell.day}
                        </Text>
                      </View>
                      <View style={styles.dotsRow}>
                        {mark?.dots.map((c, di) => (
                          <View
                            key={di}
                            style={[styles.dot, { backgroundColor: CATEGORY[c].color }]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.dayAmount, { color: colors.brand }]}>
                        {mark?.amount ?? ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.legend}>
            {(Object.keys(CATEGORY) as Category[]).map((c) => (
              <View key={c} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: CATEGORY[c].color }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                  {CATEGORY[c].label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected-day detail */}
        <View style={styles.detailHeader}>
          <Text style={[styles.detailDate, { color: colors.textPrimary }]}>
            7월 6일 (월)
          </Text>
          <Text style={[styles.detailWage, { color: colors.brand }]}>
            일급 <Text style={styles.detailWageAmount}>₩104,000</Text>
          </Text>
        </View>

        <View style={[styles.scheduleCard, { backgroundColor: colors.surfaceElevated }]}>
          <View style={[styles.scheduleBar, { backgroundColor: colors.brand }]} />
          <View style={styles.scheduleBody}>
            <Text style={[styles.scheduleTitle, { color: colors.textPrimary }]}>
              스타벅스 강남점
            </Text>
            <Text style={[styles.scheduleTime, { color: colors.textSecondary }]}>
              09:00 – 14:00  ·  5시간
            </Text>
          </View>
          <Text style={[styles.scheduleWage, { color: colors.textPrimary }]}>
            ₩60,000
          </Text>
        </View>
      </ScrollView>

      {/* Floating add button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.brand }]}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={28} color={colors.accentText} />
      </TouchableOpacity>

      {/* Bottom tab bar */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surfaceElevated, borderTopColor: colors.divider },
        ]}
      >
        {[
          { icon: 'calendar', label: '캘린더', active: true },
          { icon: 'bar-chart-2', label: '통계', active: false },
          { icon: 'list', label: '근무지', active: false },
          { icon: 'user', label: '내정보', active: false },
        ].map((t) => {
          const tint = t.active ? colors.brand : colors.textMuted;
          return (
            <TouchableOpacity key={t.label} style={styles.tabItem} activeOpacity={0.7}>
              <Feather name={t.icon as any} size={22} color={tint} />
              <Text style={[styles.tabLabel, { color: tint }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// --- Styles (layout/spacing/type from tokens; colors applied inline) ----------

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: 120 },

  // Header
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

  // Earnings card
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

  // Cards
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  monthTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.lg,
  },

  // Calendar
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

  divider: { height: 1, marginVertical: spacing.md },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  // Selected-day detail
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
  },
  scheduleBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: radius.full,
  },
  scheduleBody: { flex: 1, gap: spacing.xs },
  scheduleTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  scheduleTime: { fontSize: fontSize.sm },
  scheduleWage: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 96,
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  tabLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
});
