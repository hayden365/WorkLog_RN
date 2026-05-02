import React, { useCallback, memo } from "react";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import { useDateStore } from "../store/dateStore";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useCalendarDisplayStore } from "../store/shiftStore";
import { CalendarDisplayItem } from "../models/WorkSession";
import "../utils/calendarOptions";
import { useTheme } from "../hooks/useTheme";

interface DayProps {
  date?: any;
  state?: string;
  onDaySelected: (date: string) => void;
  selectedDate: string;
  calendarDisplayItems?: any[];
}

const CustomDayComponent = memo(function CustomDayComponent(props: DayProps) {
  const { colors } = useTheme();
  const { date, state, onDaySelected, selectedDate, calendarDisplayItems = [] } = props;

  const today = dayjs().format("YYYY-MM-DD");
  const isToday = date?.dateString === today;
  const isSelected = date?.dateString === selectedDate;

  const handleDayPress = () => onDaySelected(date?.dateString || "");

  return (
    <TouchableOpacity
      onPress={handleDayPress}
      activeOpacity={0.8}
      style={styles.dayContainer}
    >
      <View
        style={[
          styles.dayCircle,
          isSelected && { backgroundColor: colors.calendarSelected },
          isToday && !isSelected && { borderWidth: 2, borderColor: colors.calendarToday },
        ]}
      >
        <Text
          style={[
            styles.dayText,
            { color: colors.textPrimary },
            isSelected && { color: colors.accentText, fontWeight: "600" },
            isToday && !isSelected && { color: colors.calendarToday, fontWeight: "600" },
            state === "disabled" && { color: colors.calendarDisabled },
          ]}
        >
          {date?.day}
        </Text>
      </View>

      {/* 기존 periods 표시 */}
      <View style={styles.periodsContainer}>
        {calendarDisplayItems.map((item: CalendarDisplayItem, index: number) => (
          <View
            key={`${item.color}-${index}-${date?.dateString}`}
            style={[styles.period, { backgroundColor: item.color }]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
});

interface CalendarPageProps {
  selectedDate: string;
  onDaySelected: (date: string) => void;
}

export const CalendarPage = ({
  selectedDate,
  onDaySelected,
}: CalendarPageProps) => {
  const { colors } = useTheme();
  const { setMonth } = useDateStore();
  const { calendarDisplayMap } = useCalendarDisplayStore();

  const handleDayPress = useCallback(
    (day: any) => {
      onDaySelected(day.dateString);
    },
    [onDaySelected]
  );

  // dayComponent를 메모이제이션된 함수로 생성
  const dayComponent = useCallback(
    (props: any) => {
      const dateString = props.date?.dateString;
      const calendarDisplayItems = dateString
        ? calendarDisplayMap[dateString] || []
        : [];

      return (
        <CustomDayComponent
          {...props}
          onDaySelected={onDaySelected}
          selectedDate={selectedDate}
          calendarDisplayItems={calendarDisplayItems}
        />
      );
    },
    [onDaySelected, selectedDate, calendarDisplayMap]
  );

  return (
    <View style={[styles.calendarContainer, { backgroundColor: colors.background }]}>
      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        onMonthChange={(month) => {
          setMonth(month.month - 1);
        }}
        firstDay={1}
        renderHeader={(date) => {
          const month = date?.getMonth() + 1;
          const year = date?.getFullYear();
          return (
            <View style={styles.header}>
              <Text style={[styles.headerText, { color: colors.textPrimary }]}>{year}년</Text>
              <Text style={[styles.headerText, { color: colors.textPrimary }]}>{month}월</Text>
            </View>
          );
        }}
        dayComponent={dayComponent}
        enableSwipeMonths={true}
        renderArrow={(direction) => (
          <Text style={[styles.arrowText, { color: colors.textPrimary }]}>
            {direction === "left" ? "<" : ">"}
          </Text>
        )}
        style={styles.calendar}
        theme={{
          selectedDayTextColor: colors.accentText,
          todayTextColor: colors.calendarToday,
          dotColor: colors.danger,
          textSectionTitleColor: colors.textPrimary,
          textDayHeaderFontWeight: "600",
          textDayFontWeight: "400",
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textMonthFontWeight: "600",
          arrowColor: colors.textPrimary,
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleDisabledColor: colors.calendarDisabled,
          selectedDayBackgroundColor: colors.calendarSelected,
          dayTextColor: colors.textPrimary,
          textDisabledColor: colors.calendarDisabled,
          selectedDotColor: colors.accentText,
          monthTextColor: colors.textPrimary,
          indicatorColor: colors.accent,
          textDayFontFamily: "System",
          textMonthFontFamily: "System",
          textDayHeaderFontFamily: "System",
          textDayHeaderFontSize: 13,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    borderRadius: 12,
    elevation: 2,
  },
  calendar: {
    borderRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 6,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "500",
  },
  arrowText: {
    fontSize: 22,
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  dayContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  dayText: {
    fontWeight: "400",
    fontSize: 16,
  },
  periodsContainer: {
    width: "100%",
    marginBottom: 2,
    gap: 2,
  },
  period: {
    flex: 1,
    height: 5,
    borderRadius: 50,
  },
});
