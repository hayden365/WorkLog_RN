import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { WorkSession } from "../models/WorkSession";
import { format } from "date-fns";
import { repeatOptions } from "../utils/repeatOptions";
import { useTheme } from "../hooks/useTheme";

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
  const { colors } = useTheme();

  const formatDate = (date: Date) => {
    return format(date, "MM월 dd일");
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
      style={[styles.container, { borderLeftColor: session.color, backgroundColor: colors.surface }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{session.jobName}</Text>
          {/* check */}
          {session.repeatOption !== "daily" && (
            <View style={[styles.repeatBadge, { backgroundColor: colors.divider }]}>
              <Text style={[styles.repeatText, { color: colors.textSecondary }]}>
                {
                  repeatOptions.find(
                    (option) => option.value === session.repeatOption
                  )?.label
                }
              </Text>
            </View>
          )}
        </View>
        {onDelete && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.danger }]}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.deleteText, { color: colors.accentText }]}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.timeContainer}>
        <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>시간:</Text>
        <Text style={[styles.time, { color: colors.textPrimary }]}>
          {formatTime(session.startTime)} ~ {formatTime(session.endTime)}
        </Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>기간:</Text>
        <Text style={[styles.date, { color: colors.textPrimary }]}>
          {`${formatDate(session.startDate)} ~`}
          {session.endDate && ` ${formatDate(session.endDate)}`}
        </Text>
      </View>

      {session.wage > 0 && (
        <View style={styles.wageContainer}>
          <Text style={[styles.wageLabel, { color: colors.textSecondary }]}>시급:</Text>
          <Text style={[styles.wage, { color: colors.accent }]}>{session.wage.toLocaleString()}원</Text>
        </View>
      )}

      {session.description && (
        <View style={[styles.descriptionContainer, { borderTopColor: colors.divider }]}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{session.description}</Text>
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
    marginRight: 8,
  },
  repeatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  repeatText: {
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
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
    marginRight: 8,
    fontWeight: "500",
  },
  time: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: "500",
  },
  date: {
    fontSize: 14,
    fontWeight: "500",
  },
  wageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  wageLabel: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: "500",
  },
  wage: {
    fontSize: 14,
    fontWeight: "600",
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  description: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
