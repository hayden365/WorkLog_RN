import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { WorkSession } from "../models/WorkSession";

const ScheduleCard = ({ session }: { session: WorkSession }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{session.jobName}</Text>
      <Text style={styles.time}>
        {session.startDate.getHours()}:{session.startDate.getMinutes()} ~{" "}
        {session.endDate?.getHours()}:{session.endDate?.getMinutes()}
      </Text>
    </View>
  );
};

export default ScheduleCard;

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  title: { fontSize: 16, fontWeight: "bold" },
  time: { fontSize: 14 },
});
