import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EarningsCard } from '../components/EarningsCard';
import { NewSessionModal } from '../components/NewSessionModal';
import { WorkSession } from '../models/WorkSession';
import { CalendarPage } from '../components/CalendarPage';
import { useDateStore } from '../store/dateStore';
import {
  useDateScheduleStore,
  useCalendarDisplayStore,
  useShiftStore,
} from '../store/shiftStore';
import { useScheduleManager } from '../hooks/useScheduleManager';
import { useTheme } from '../hooks/useTheme';

import { generateViewMonthScheduleData } from '../utils/calendarfns';
import { displayMonthlyWage } from '../utils/wageFns';
import ScheduleCard from '../components/ScheduleCard';
import ScheduleModal from '../components/ScheduleModal';
import { AdBanner } from '../components/AdBanner';

// 타입 정의 추가
interface Period {
  startingDay: boolean;
  endingDay: boolean;
  color: string;
}

interface MarkedDate {
  periods: Period[];
}

const HomeScreen = () => {
  const { colors } = useTheme();
  const { reset } = useShiftStore();
  const { allSchedulesById, addSchedule, getAllSchedules } =
    useScheduleManager();
  const { dateSchedule, setDateSchedule } = useDateScheduleStore();
  const { setCalendarDisplay, calendarDisplayMap } = useCalendarDisplayStore();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedDateSchedule, setSelectedDateSchedule] = useState<
    WorkSession[]
  >([]);
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >(undefined);

  const { month } = useDateStore();

  const [earnings, setEarnings] = useState<number>(0);

  const handleSave = (newSession: Partial<WorkSession>) => {
    addSchedule(newSession as WorkSession);
  };

  // 스케줄이 변경될 때 달력 데이터 업데이트
  useEffect(() => {
    const allSchedules = getAllSchedules(); // 전체 스케줄 자체의 데이터 객체의 배열
    const now = new Date();
    const viewMonth = new Date(now.getFullYear(), month, 1);
    // 월별 스케줄 데이터: dateSchedule 업데이트, 달력 표시 데이터: markedDates 생성
    const { markedDates: newUIMarkedDates, dateSchedule: newDateScheduleById } =
      generateViewMonthScheduleData(allSchedules, viewMonth);

    setDateSchedule(newDateScheduleById);
    // 달력 표시 데이터 업데이트
    setCalendarDisplay(newUIMarkedDates);

    // 월 수익 계산
    const monthlyEarnings = displayMonthlyWage(
      newDateScheduleById,
      allSchedulesById,
      viewMonth,
    );
    setEarnings(monthlyEarnings);
  }, [allSchedulesById, month]);

  // 선택된 날짜의 스케줄 계산
  useEffect(() => {
    const selectedDateScheduleIds = dateSchedule[selectedDate] || [];
    const selectedDateSchedule: WorkSession[] = [];

    for (const id of selectedDateScheduleIds) {
      const session = allSchedulesById[id];
      if (session) selectedDateSchedule.push(session);
    }
    setSelectedDateSchedule(selectedDateSchedule);
  }, [dateSchedule, selectedDate, allSchedulesById]);

  const [bannerHeight, setBannerHeight] = useState(0);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <CalendarPage
          selectedDate={selectedDate}
          onDaySelected={setSelectedDate}
        />
        <EarningsCard totalEarnings={earnings} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.dateText, { color: colors.textPrimary }]}>
            {new Date(selectedDate).getMonth() + 1}월{' '}
            {new Date(selectedDate).getDate()}일 일정
          </Text>
          {selectedDateSchedule.length === 0 ? (
            <Text style={[styles.noScheduleText, { color: colors.textSecondary }]}>일정이 없습니다</Text>
          ) : (
            selectedDateSchedule.map((session, index) => (
              <ScheduleCard
                key={session.id}
                session={session}
                onPress={() => {
                  setSelectedSessionId(session.id);
                  setScheduleModalVisible(true);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: bannerHeight + 24, backgroundColor: colors.accent }]}
        onPress={() => { reset(); setModalVisible(true); }}
      >
        <Text style={[styles.fabIcon, { color: colors.accentText }]}>＋</Text>
      </TouchableOpacity>

      <View
        onLayout={(e) => setBannerHeight(e.nativeEvent.layout.height)}
      >
        <AdBanner />
      </View>

      <NewSessionModal
        visible={modalVisible}
        mode='create'
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />

      <ScheduleModal
        visible={scheduleModalVisible}
        onClose={() => {
          setScheduleModalVisible(false);
          setSelectedSessionId(undefined);
        }}
        sessionId={selectedSessionId}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
    gap: 24,
  },
  card: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  noScheduleText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});
