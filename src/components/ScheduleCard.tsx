import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { WorkSession } from "../models/WorkSession";
import { format } from "date-fns";

interface ScheduleCardProps {
  session: WorkSession;
  onPress?: (session: WorkSession) => void;
  onDelete?: (sessionId: string) => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  session,
  onPress,
  onDelete,
}) => {
  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  const formatDate = (date: Date) => {
    return format(date, "MM월 dd일");
  };

  const getRepeatText = () => {
    switch (session.repeatOption) {
      case "daily":
        return "매일";
      case "weekly":
        return "매주";
      case "biweekly":
        return "격주";
      case "triweekly":
        return "3주마다";
      case "monthly":
        return "매월";
      default:
        return "";
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(session);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(session.id);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: session.color }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{session.jobName}</Text>
          {/* check */}
          {session.repeatOption !== "daily" && (
            <View style={styles.repeatBadge}>
              <Text style={styles.repeatText}>{getRepeatText()}</Text>
            </View>
          )}
        </View>
        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.timeLabel}>시간:</Text>
        <Text style={styles.time}>
          {formatTime(session.startTime)} ~ {formatTime(session.endTime)}
        </Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.dateLabel}>기간:</Text>
        <Text style={styles.date}>
          {formatDate(session.startDate)}
          {session.endDate && ` ~ ${formatDate(session.endDate)}`}
        </Text>
      </View>

      {session.wage > 0 && (
        <View style={styles.wageContainer}>
          <Text style={styles.wageLabel}>시급:</Text>
          <Text style={styles.wage}>{session.wage.toLocaleString()}원</Text>
        </View>
      )}

      {session.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{session.description}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ScheduleCard;

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  repeatBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  repeatText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
    fontWeight: "500",
  },
  time: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
    fontWeight: "500",
  },
  date: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  wageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  wageLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
    fontWeight: "500",
  },
  wage: {
    fontSize: 14,
    color: "#007aff",
    fontWeight: "600",
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  description: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});
