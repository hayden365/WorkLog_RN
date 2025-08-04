import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CalendarDisplayItem as CalendarDisplayItemType } from "../models/WorkSession";

interface CalendarDisplayItemProps {
  item: CalendarDisplayItemType;
  onPress?: (sessionId: string) => void;
  isSelected?: boolean;
}

export const CalendarDisplayItem: React.FC<CalendarDisplayItemProps> = ({
  item,
  onPress,
  isSelected = false,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(item.sessionId);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: item.color },
        isSelected && styles.selected,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.jobName} numberOfLines={1}>
        {item.jobName}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 1,
    marginHorizontal: 1,
    minHeight: 24,
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selected: {
    elevation: 4,
    shadowOpacity: 0.4,
    transform: [{ scale: 1.05 }],
  },
  jobName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
