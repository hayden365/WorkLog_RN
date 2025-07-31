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
import { useDateScheduleStore, useScheduleStore } from "../store/shiftStore";

import { MarkingProps } from "react-native-calendars/src/calendar/day/marking";
import {
  getMarkedDatesFromMonthlySchedule,
  getMarkedDatesFromWeeklySchedule,
  calculateScheduleByDate,
} from "../utils/calendarFns";
import ScheduleCard from "../components/ScheduleCard";

const HomeScreen = () => {
  const { schedule, addSchedule } = useScheduleStore();
  const { dateSchedule, addDateSchedule } = useDateScheduleStore();
  const [markedDates, setMarkedDates] = useState<Record<string, MarkingProps>>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateSchedule, setSelectedDateSchedule] = useState<
    WorkSession[]
  >([]);
  const { month } = useDateStore();
  // eventmap schedulemap 연동하는방법
  // updatemap은 추가된 세션.
  // markedDates는 일별로, 특정 달의 일정이 calendar형식에 맞게 가공한 결과.
  const handleSave = (newSession: WorkSession) => {
    addSchedule(newSession);
  };

  // schedule이 변경될 때 dateSchedule 업데이트
  useEffect(() => {
    let newDateSchedule = { ...dateSchedule };
    const newMarkedDates: Record<string, MarkingProps> = {};

    schedule.forEach((session) => {
      if (session.repeatOption === "daily") {
        newMarkedDates[session.startDate.toISOString().slice(0, 10)] = {
          periods: [
            {
              startingDay: true,
              endingDay: true,
              color: "#f0e68c",
            },
          ],
        };
        newDateSchedule = calculateScheduleByDate(
          [session.startDate.toISOString().slice(0, 10)],
          session.id,
          newDateSchedule
        );
      } else if (session.repeatOption === "weekly") {
        const weeklyDates = getMarkedDatesFromWeeklySchedule({
          schedule: session,
          viewMonth: month,
        });
        // weeklyDates에서 날짜 추출
        const dates = Object.keys(weeklyDates);
        newDateSchedule = calculateScheduleByDate(
          dates,
          session.id,
          newDateSchedule
        );

        Object.assign(newMarkedDates, weeklyDates); // 올바른 할당
      } else if (session.repeatOption === "monthly") {
        const monthlyDates = getMarkedDatesFromMonthlySchedule({
          schedule: session,
          viewMonth: month,
        });
        // monthlyDates에서 날짜 추출
        const dates = Object.keys(monthlyDates);
        newDateSchedule = calculateScheduleByDate(
          dates,
          session.id,
          newDateSchedule
        );

        Object.assign(newMarkedDates, monthlyDates); // 올바른 할당
      }
    });

    addDateSchedule(newDateSchedule);
    setMarkedDates(newMarkedDates);
  }, [schedule, month]);

  // selectedDateSchedule 계산을 위한 별도 useEffect
  useEffect(() => {
    const selectedDateScheduleIds = dateSchedule[selectedDate] || [];
    const selectedDateSchedule: WorkSession[] = [];

    for (const id of selectedDateScheduleIds) {
      const session = schedule.find((session) => session.id === id);
      if (session) selectedDateSchedule.push(session);
    }
    setSelectedDateSchedule(selectedDateSchedule);
  }, [dateSchedule, selectedDate, schedule]);
  console.log("markedDates", markedDates);
  console.log("schedule", schedule);
  console.log("dateSchedule", dateSchedule);
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <HeaderSection />
        <EarningsCard totalEarnings={calculateMonthlyEarnings(schedule)} />
        <CalendarPage
          markedDates={markedDates}
          selectedDate={selectedDate}
          onDaySelected={setSelectedDate}
        />
        <Text style={styles.dateText}>{selectedDate} 일정</Text>
        {selectedDateSchedule.length === 0 ? (
          <Text>일정 없음</Text>
        ) : (
          selectedDateSchedule.map((session, index) => (
            <ScheduleCard key={index} session={session} />
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

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  dateText: { fontSize: 18, fontWeight: "bold", marginTop: 16 },
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
  },
  fabIcon: { color: "#fff", fontSize: 28 },
});
