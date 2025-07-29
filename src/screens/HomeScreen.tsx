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
import { useScheduleStore } from "../store/shiftStore";
import {
  getMarkedDatesFromMonthlySchedule,
  getMarkedDatesFromWeeklySchedule,
} from "../utils/calendarfns";
import { MarkingProps } from "react-native-calendars/src/calendar/day/marking";

const HomeScreen = () => {
  const { schedule, setSchedule } = useScheduleStore();
  const [scheduleMap, setScheduleMap] = useState<Record<string, MarkingProps>>(
    {}
  );
  const [eventsMap, setEventsMap] = useState<Record<string, WorkSession[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [modalVisible, setModalVisible] = useState(false);
  const { month } = useDateStore();
  // updatemap과 schedulemap 연동하는방법
  const handleSave = (newSession: WorkSession) => {
    const updatedSchedule = [...schedule, newSession];
    setSchedule(updatedSchedule);
  };

  const updateEventsMap = (sessions: WorkSession[]) => {
    const newMap: Record<string, WorkSession[]> = {};

    sessions.forEach((session) => {
      const dateKey = session.startDate.toISOString().slice(0, 10);
      if (!newMap[dateKey]) newMap[dateKey] = [];
      newMap[dateKey].push(session);
    });

    setEventsMap(newMap);
    console.log("newMap", newMap);
  };

  useEffect(() => {
    schedule.forEach((session) => {
      if (session.repeatOption === "none") {
        setScheduleMap((prev) => ({
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
        setScheduleMap((prev) => ({
          ...prev,
          ...getMarkedDatesFromWeeklySchedule({
            schedule: session,
            viewMonth: new Date(new Date().setMonth(month)),
          }),
        }));
      } else if (session.repeatOption === "monthly") {
        setScheduleMap((prev) => ({
          ...prev,
          ...getMarkedDatesFromMonthlySchedule({
            schedule: session,
            viewMonth: new Date(new Date().setMonth(month)),
          }),
        }));
      }
    });
    updateEventsMap(schedule);
  }, [schedule]);

  const selectedDayEvents = eventsMap[selectedDate] || [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <HeaderSection />
        <EarningsCard totalEarnings={calculateMonthlyEarnings(schedule)} />
        <CalendarPage eventsMap={scheduleMap} onDaySelected={setSelectedDate} />
        <Text style={styles.dateText}>{selectedDate} 일정</Text>
        {selectedDayEvents.length === 0 ? (
          <Text>일정 없음</Text>
        ) : (
          selectedDayEvents.map((session, index) => (
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
