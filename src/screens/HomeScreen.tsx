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
} from "../utils/calendarFns";

const HomeScreen = () => {
  const { schedule, addSchedule } = useScheduleStore();
  const { dateSchedule } = useDateScheduleStore();
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

  useEffect(() => {
    schedule.forEach((session) => {
      if (session.repeatOption === "daily") {
        setMarkedDates((prev) => ({
          ...prev,
          [session.startDate.toISOString().slice(0, 10)]: {
            periods: [
              {
                startingDay: true,
                endingDay: true,
                color: "#f0e68c",
              },
            ],
          },
        }));
      } else if (session.repeatOption === "weekly") {
        setMarkedDates((prev) => ({
          ...prev,
          ...getMarkedDatesFromWeeklySchedule({
            schedule: session,
            viewMonth: new Date(new Date().setMonth(month)),
          }),
        }));
      } else if (session.repeatOption === "monthly") {
        setMarkedDates((prev) => ({
          ...prev,
          ...getMarkedDatesFromMonthlySchedule({
            schedule: session,
            viewMonth: new Date(new Date().setMonth(month)),
          }),
        }));
      }
    });
  }, [schedule, month]);

  useEffect(() => {
    const selectedDateScheduleIds = dateSchedule[selectedDate] || [];
    const selectedDateSchedule = schedule.filter((session) =>
      selectedDateScheduleIds.includes(session.id)
    );
    setSelectedDateSchedule(selectedDateSchedule);
  }, [dateSchedule, selectedDate]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <HeaderSection />
        <EarningsCard totalEarnings={calculateMonthlyEarnings(schedule)} />
        <CalendarPage
          markedDates={markedDates}
          onDaySelected={setSelectedDate}
        />
        <Text style={styles.dateText}>{selectedDate} 일정</Text>
        {selectedDateSchedule.length === 0 ? (
          <Text>일정 없음</Text>
        ) : (
          selectedDateSchedule.map((session, index) => (
            <View key={index} style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>{session.jobName}</Text>
              <Text>
                시간: {session.startDate.getHours()}:
                {session.startDate.getMinutes()}~ {session.endDate?.getHours()}:
                {session.endDate?.getMinutes()}
              </Text>
            </View>
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
  sessionCard: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  sessionTitle: { fontSize: 16, fontWeight: "bold" },
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
