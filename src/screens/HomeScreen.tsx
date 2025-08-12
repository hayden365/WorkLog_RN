import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { EarningsCard } from "../components/EarningsCard";
import { NewSessionModal } from "../components/NewSessionModal";
import { WorkSession } from "../models/WorkSession";
import { CalendarPage } from "../components/CalendarPage";
import { useDateStore } from "../store/dateStore";
import {
  useDateScheduleStore,
  useCalendarDisplayStore,
  useShiftStore,
} from "../store/shiftStore";
import { useScheduleManager } from "../hooks/useScheduleManager";

import { generateViewMonthScheduleData } from "../utils/calendarFns";
import { displayMonthlyWage } from "../utils/wageFns";
import ScheduleCard from "../components/ScheduleCard";
import { initializeMockData } from "../data/mockSchedules";
import { StorageTestComponent } from "../components/StorageTestComponent";
import ScheduleModal from "../components/ScheduleModal";

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
  const { reset } = useShiftStore();
  const { allSchedulesById, addSchedule, getAllSchedules } =
    useScheduleManager();
  const { dateSchedule, setDateSchedule } = useDateScheduleStore();
  const { setCalendarDisplay, calendarDisplayMap } = useCalendarDisplayStore();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
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

  // 앱 초기화 시 목데이터 로드
  // useEffect(() => {
  //   if (!isInitialized && Object.keys(allSchedulesById).length === 0) {
  //     const mockData = initializeMockData();
  //     mockData.forEach((schedule) => {
  //       addSchedule(schedule);
  //     });
  //     setIsInitialized(true);
  //     console.log("목데이터 로드 완료");
  //   }
  // }, [isInitialized, allSchedulesById, addSchedule]);

  const handleSave = (newSession: Partial<WorkSession>) => {
    addSchedule(newSession as WorkSession);
  };

  // 스케줄이 변경될 때 달력 데이터 업데이트
  useEffect(() => {
    const allSchedules = getAllSchedules(); // 전체 스케줄 자체의 데이터 객체의 배열
    console.log("allSchedules", allSchedules);
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
      viewMonth
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* <HeaderSection /> */}
        <CalendarPage
          selectedDate={selectedDate}
          onDaySelected={setSelectedDate}
        />
        <EarningsCard totalEarnings={earnings} />
        <View style={styles.card}>
          <Text style={styles.dateText}>
            {new Date(selectedDate).getMonth() + 1}월{" "}
            {new Date(selectedDate).getDate()}일 일정
          </Text>
          {selectedDateSchedule.length === 0 ? (
            <Text style={styles.noScheduleText}>일정이 없습니다</Text>
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

        {/* 스케줄 저장 테스트 컴포넌트 */}
        {/* <StorageTestComponent /> */}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          reset();
          setModalVisible(true);
        }}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <NewSessionModal
        visible={modalVisible}
        mode="create"
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
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  scrollViewContent: {
    paddingBottom: 100,
    gap: 24,
  },
  card: {
    width: "100%",
    padding: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
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
