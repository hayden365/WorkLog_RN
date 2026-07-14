import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { CalendarDisplayItem as CalendarDisplayItemType } from "../models/WorkSession";
import { useTheme } from "../hooks/useTheme";
import { AppText as Text } from './AppText';

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
  const { colors } = useTheme();

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
        isSelected && { borderColor: colors.accentText },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.jobName, { color: colors.accentText }]} numberOfLines={1}>
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
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.15)",
  },
  selected: {
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  jobName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
