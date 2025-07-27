import React, { useState } from "react";
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

const HomeScreen = () => {
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, WorkSession[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [modalVisible, setModalVisible] = useState(false);
  console.log("workSessions", workSessions);
  const handleSave = (newSession: WorkSession) => {
    const updatedSessions = [...workSessions, newSession];
    setWorkSessions(updatedSessions);
    updateEventsMap(updatedSessions);
  };

  const updateEventsMap = (sessions: WorkSession[]) => {
    const newMap: Record<string, WorkSession[]> = {};

    sessions.forEach((session) => {
      const dateKey = session.startDate.toISOString().slice(0, 10);
      if (!newMap[dateKey]) newMap[dateKey] = [];
      newMap[dateKey].push(session);
    });

    setEventsMap(newMap);
  };

  const selectedDayEvents = eventsMap[selectedDate] || [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <HeaderSection />
        <EarningsCard totalEarnings={calculateMonthlyEarnings(workSessions)} />
        <CalendarPage eventsMap={eventsMap} onDaySelected={setSelectedDate} />
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
