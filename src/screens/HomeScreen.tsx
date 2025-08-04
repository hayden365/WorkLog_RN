import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { EarningsCard } from "../components/EarningsCard";
import { HeaderSection } from "../components/HeaderSection";
import { NewSessionModal } from "../components/NewSessionModal";
import { WorkSession } from "../models/WorkSession";
import { CalendarPage } from "../components/CalendarPage";
import { useDateStore } from "../store/dateStore";
import {
  useDateScheduleStore,
  useScheduleStore,
  useCalendarDisplayStore,
} from "../store/shiftStore";

import { generateViewMonthScheduleData } from "../utils/calendarFns";
import ScheduleCard from "../components/ScheduleCard";
import { initializeMockData } from "../data/mockSchedules";

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
  const { allSchedulesById, addSchedule, getAllSchedules } = useScheduleStore();
  const { dateSchedule, addDateSchedule, updateDateSchedule } =
    useDateScheduleStore();
  const { calendarDisplayMap, updateCalendarDisplay } =
    useCalendarDisplayStore();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateSchedule, setSelectedDateSchedule] = useState<
    WorkSession[]
  >([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const { month } = useDateStore();

  // 앱 초기화 시 목데이터 로드
  useEffect(() => {
    if (!isInitialized && Object.keys(allSchedulesById).length === 0) {
      const mockData = initializeMockData();
      mockData.forEach((schedule) => {
        addSchedule(schedule);
      });
      setIsInitialized(true);
      console.log("목데이터 로드 완료");
    }
  }, [isInitialized, allSchedulesById, addSchedule]);

  const handleSave = (newSession: WorkSession) => {
    addSchedule(newSession);
  };

  // 스케줄이 변경될 때 달력 데이터 업데이트
  useEffect(() => {
    const allSchedules = getAllSchedules(); // 전체 스케줄 자체의 데이터 객체의 배열
    const now = new Date();
    const viewMonth = new Date(now.getFullYear(), month, 1);

    // 월별 스케줄 데이터: dateSchedule 업데이트, 달력 표시 데이터: markedDates 생성
    const { markedDates: newUIMarkedDates, dateSchedule: newDateScheduleById } =
      generateViewMonthScheduleData(allSchedules, viewMonth);

    // 스토어 업데이트
    addDateSchedule(newDateScheduleById);

    // 달력 표시 데이터 업데이트
    Object.entries(newUIMarkedDates).forEach(([date, items]) => {
      updateCalendarDisplay(date, items);
    });
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

  // 월 수익 계산
  const calculateMonthlyEarnings = (sessions: WorkSession[]) => {
    let total = 0;
    sessions.forEach((session) => {
      const startMinutes =
        session.startTime.getHours() * 60 + session.startTime.getMinutes();
      let endMinutes = 0;
      if (session.endTime) {
        endMinutes =
          session.endTime.getHours() * 60 + session.endTime.getMinutes();
      }
      const workMinutes = endMinutes - startMinutes;
      const workHours = workMinutes / 60;
      total += workHours * session.wage;
    });
    return Math.round(total);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <HeaderSection />
        <EarningsCard
          totalEarnings={calculateMonthlyEarnings(getAllSchedules())}
        />
        <CalendarPage
          selectedDate={selectedDate}
          onDaySelected={setSelectedDate}
        />
        <Text style={styles.dateText}>{selectedDate} 일정</Text>
        {selectedDateSchedule.length === 0 ? (
          <Text style={styles.noScheduleText}>일정이 없습니다</Text>
        ) : (
          selectedDateSchedule.map((session, index) => (
            <ScheduleCard key={session.id} session={session} />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <NewSessionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  noScheduleText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007aff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
});
