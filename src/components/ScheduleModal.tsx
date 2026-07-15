import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { AppText as Text } from './AppText';
import { WorkSession } from '../models/WorkSession';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Ionicons, Feather, Entypo } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useScheduleManager } from '../hooks/useScheduleManager';
import { NewSessionModal } from './NewSessionModal';
import { useShiftStore } from '../store/shiftStore';
import { useWorkplaceStore } from '../store/workplaceStore';
import { formatNumberWithComma } from '../utils/formatNumbs';
import { dayNames, repeatOptions } from '../utils/repeatOptions';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize, fontWeight } from '../theme/tokens';
import { sessionTotalMinutes } from '../utils/payFns';
import { resolveEditInitValues } from '../utils/sessionForm';

interface ScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  sessionId?: string;
}

const wageTypeLabel = (type: 'hourly' | 'daily' | 'monthly' | undefined) =>
  type === 'hourly' ? '시급' : type === 'daily' ? '일급' : '월급';

const formatTime = (value: Date) =>
  new Date(value).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const ScheduleModal = ({ visible, onClose, sessionId }: ScheduleModalProps) => {
  const { colors } = useTheme();
  const { getScheduleById, deleteSchedule, updateSchedule } =
    useScheduleManager();
  const session = sessionId ? getScheduleById(sessionId) : undefined;
  // 근무지 이름·색상은 더 이상 세션에 저장되지 않으므로 근무지 스토어에서 해석한다.
  const workplace = useWorkplaceStore((s) =>
    session ? s.workplacesById[session.workplaceId] : undefined,
  );

  const {
    setWage,
    setWageType,
    setBreakMinutes,
    setStartTime,
    setEndTime,
    setStartDate,
    setEndDate,
    setRepeatOption,
    setSelectedWeekDays,
    setDescription,
  } = useShiftStore();

  const scrollViewRef = useRef<ScrollView>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);

  if (!session) return null;

  // 세션 오버라이드가 null이면 근무지 기본값을 상속한다.
  const wage = session.wage ?? workplace?.wage ?? 0;
  const wageType = session.wageType ?? workplace?.wageType;
  const breakMinutes =
    session.breakMinutes ?? workplace?.defaultBreakMinutes ?? 0;

  const totalMinutes = sessionTotalMinutes(
    new Date(session.startTime),
    new Date(session.endTime),
  );
  const paidMinutes = Math.max(0, totalMinutes - breakMinutes);

  const handleDelete = () => {
    Alert.alert('확인', '스케줄을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          if (sessionId) {
            deleteSchedule(sessionId);
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (session) {
      // shiftStore의 상태를 먼저 설정 (근무지 선택은 NewSessionModal의 useEffect가 처리)
      // 세션 오버라이드가 없으면(null) 근무지 기본값으로 상속해야 하므로
      // session.wage/session.wageType을 직접 || 0으로 폴백하지 않는다.
      const init = resolveEditInitValues(session, workplace);
      setWage(init.wage);
      setWageType(init.wageType);
      setBreakMinutes(init.breakMinutes);
      setStartTime(session.startTime || new Date());
      setEndTime(session.endTime || new Date());
      setStartDate(session.startDate || new Date());
      setEndDate(session.endDate || new Date());
      setRepeatOption(session.repeatOption || 'none');
      setSelectedWeekDays(session.selectedWeekDays || new Set());
      setDescription(session.description || '');
      // 상태 설정 후 모달 열기
      setEditModalVisible(true);
    }
  };

  const handleUpdate = (updatedSession: WorkSession) => {
    updateSchedule(updatedSession.id, updatedSession);
    onClose();
    setEditModalVisible(false);
  };

  return (
    <Modal visible={visible} animationType='slide' presentationStyle='pageSheet'>
      <SafeAreaView
        style={[styles.areaContainer, { backgroundColor: colors.surface }]}
      >
        <View style={styles.headerContainer}>
          {/* 닫기 */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: colors.surfaceElevated },
            ]}
            onPress={onClose}
          >
            <Feather name='x' size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.textPrimary }]}>
            근무 일정
          </Text>
          {/* 수정 · 삭제 */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: colors.surfaceElevated },
              ]}
              onPress={handleEdit}
            >
              <MaterialCommunityIcons
                name='pencil'
                size={18}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: colors.surfaceElevated },
              ]}
              onPress={handleDelete}
            >
              <Ionicons
                name='trash-outline'
                size={18}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* 근무지 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.inputGroup}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name='location-outline'
                  size={22}
                  color={colors.brand}
                />
              </View>
              <View style={styles.valueRow}>
                <View
                  style={[
                    styles.workplaceDot,
                    { backgroundColor: workplace?.color ?? colors.border },
                  ]}
                />
                <Text style={[styles.value, { color: colors.textPrimary }]}>
                  {workplace?.name ?? '근무지 없음'}
                </Text>
              </View>
            </View>
          </View>

          {/* 급여 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.inputGroup}>
              <View style={styles.iconWrap}>
                <Ionicons name='cash-outline' size={22} color={colors.brand} />
              </View>
              <View style={styles.valueRow}>
                <FontAwesome name='won' size={16} color={colors.textSecondary} />
                <Text style={[styles.value, { color: colors.textPrimary }]}>
                  {formatNumberWithComma(String(wage))}
                </Text>
                <Text style={[styles.badge, { color: colors.textSecondary }]}>
                  {wageTypeLabel(wageType)}
                </Text>
              </View>
            </View>
          </View>

          {/* 시간 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.inputGroup}>
              <View style={styles.iconWrap}>
                <Ionicons name='time-outline' size={22} color={colors.brand} />
              </View>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {`${formatTime(session.startTime)} - ${formatTime(
                  session.endTime,
                )}`}
              </Text>
            </View>
          </View>

          {/* 휴게시간 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.inputGroup}>
              <View style={styles.iconWrap}>
                <Ionicons name='cafe-outline' size={22} color={colors.brand} />
              </View>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {`휴게 ${breakMinutes}분`}
              </Text>
            </View>
            <Text style={{ fontSize: fontSize.md, color: colors.textSecondary }}>
              {`실 근무 ${(paidMinutes / 60).toFixed(1)}시간 (총 ${(
                totalMinutes / 60
              ).toFixed(1)}시간, 휴게 ${breakMinutes}분)`}
            </Text>
          </View>

          {/* 날짜 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.inputGroup}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name='calendar-outline'
                  size={22}
                  color={colors.brand}
                />
              </View>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {new Date(session.startDate).toLocaleDateString('ko-KR')}
                {session.isCurrentlyWorking
                  ? ' - 종료일 없음'
                  : session.endDate
                  ? ` - ${new Date(session.endDate).toLocaleDateString('ko-KR')}`
                  : ''}
              </Text>
            </View>
          </View>

          {/* 반복 주기 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.inputGroup}>
              <View style={styles.iconWrap}>
                <Ionicons name='repeat-outline' size={22} color={colors.brand} />
              </View>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {repeatOptions.find((r) => r.value === session.repeatOption)
                  ?.label ?? '반복 없음'}
              </Text>
            </View>
            {/* 요일 선택 */}
            {(session.repeatOption === 'weekly' ||
              session.repeatOption === 'biweekly') && (
              <View style={styles.rowWrap}>
                {dayNames.map((day) => {
                  const selected = session.selectedWeekDays.has(day.value);
                  return (
                    <View
                      key={day.value}
                      style={[
                        styles.optionButton,
                        { borderColor: colors.border },
                        selected && {
                          backgroundColor: colors.brand,
                          borderColor: colors.brand,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: fontSize.md,
                          fontWeight: fontWeight.medium,
                          color: selected
                            ? colors.accentText
                            : colors.textMuted,
                        }}
                      >
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* 메모 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <Entypo name='text' size={22} color={colors.brand} />
              </View>
              <Text
                style={[
                  styles.value,
                  styles.memo,
                  {
                    color: session.description
                      ? colors.textPrimary
                      : colors.textMuted,
                  },
                ]}
              >
                {session.description || '설명 없음'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <NewSessionModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleUpdate}
        mode='update'
        existingSession={session}
      />
    </Modal>
  );
};

export default ScheduleModal;

const styles = StyleSheet.create({
  areaContainer: { flex: 1 },
  headerContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  header: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  inputGroup: {
    flexDirection: 'row',
    minHeight: 48,
    alignItems: 'center',
    gap: spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 28,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  value: {
    flex: 1,
    fontSize: fontSize.base,
  },
  badge: {
    fontSize: fontSize.md,
  },
  memo: {
    paddingVertical: spacing.md,
    lineHeight: 22,
  },
  workplaceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-around',
  },
  optionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.full,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
