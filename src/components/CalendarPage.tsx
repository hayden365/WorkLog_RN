import React, { useCallback, PureComponent } from "react";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import { useDateStore } from "../store/dateStore";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useCalendarDisplayStore } from "../store/shiftStore";
import { CalendarDisplayItem } from "../models/WorkSession";
import "../utils/calendarOptions";

class CustomDayComponent extends PureComponent<{
  date?: any;
  state?: string;
  onDaySelected: (date: string) => void;
  selectedDate: string;
  calendarDisplayItems?: any[];
}> {
  render() {
    const {
      date,
      state,
      onDaySelected,
      selectedDate,
      calendarDisplayItems = [],
    } = this.props;

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
            isSelected && styles.selectedDayCircle,
            isToday && styles.todayCircle,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && styles.selectedDayText,
              isToday && !isSelected && styles.todayText,
              state === "disabled" && styles.disabledDayText,
            ]}
          >
            {date?.day}
          </Text>
        </View>

        {/* 기존 periods 표시 */}
        <View style={styles.periodsContainer}>
          {calendarDisplayItems.map(
            (item: CalendarDisplayItem, index: number) => (
              <View
                key={`${item.color}-${index}-${date?.dateString}`}
                style={[
                  styles.period,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              />
            )
          )}
        </View>
      </TouchableOpacity>
    );
  }
}

interface CalendarPageProps {
  selectedDate: string;
  onDaySelected: (date: string) => void;
}

export const CalendarPage = ({
  selectedDate,
  onDaySelected,
}: CalendarPageProps) => {
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
    <View style={styles.calendarContainer}>
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
              <Text style={styles.headerText}>{year}년</Text>
              <Text style={styles.headerText}>{month}월</Text>
            </View>
          );
        }}
        dayComponent={dayComponent}
        style={styles.calendar}
        theme={{
          selectedDayTextColor: "#ffffff",
          todayTextColor: "#007aff",
          dotColor: "#ff2d55",
          textSectionTitleColor: "#1c1c1e",
          textDayHeaderFontWeight: "600",
          textDayFontWeight: "400",
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textMonthFontWeight: "600",
          arrowColor: "#000",
          backgroundColor: "#ffffff",
          calendarBackground: "#ffffff",
          textSectionTitleDisabledColor: "#d9e1e8",
          selectedDayBackgroundColor: "#007aff",
          dayTextColor: "#2d4150",
          textDisabledColor: "#d9e1e8",
          selectedDotColor: "#ffffff",
          monthTextColor: "#2d4150",
          indicatorColor: "#007aff",
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
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  calendar: {
    borderRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    gap: 6,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "500",
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
  selectedDayCircle: {
    backgroundColor: "#007AFF",
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  dayText: {
    color: "#2d4150",
    fontWeight: "400",
    fontSize: 16,
  },
  selectedDayText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  todayText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  disabledDayText: {
    color: "#d9e1e8",
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
