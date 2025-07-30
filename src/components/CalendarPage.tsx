import React, { useCallback, useMemo, PureComponent } from "react";
import { Calendar } from "react-native-calendars";
import { WorkSession } from "../models/WorkSession";
import dayjs from "dayjs";
import { useDateStore } from "../store/dateStore";
import { repeatOptions } from "../utils/repeatOptions";
import { MarkingProps } from "react-native-calendars/src/calendar/day/marking";
import { Text, TouchableOpacity, View } from "react-native";

// 별도의 클래스 컴포넌트로 분리
class CustomDayComponent extends PureComponent<{
  date?: any;
  state?: string;
  marking?: any;
  onDaySelected: (date: string) => void;
  selectedDate: string;
}> {
  // PureComponent는 자동으로 shouldComponentUpdate를 구현합니다
  // props가 변경되지 않으면 리렌더링하지 않습니다

  render() {
    const { date, state, marking, onDaySelected, selectedDate } = this.props;
    const today = dayjs().format("YYYY-MM-DD");
    const isToday = date?.dateString === today;
    const isSelected = date?.dateString === selectedDate;

    const handleDayPress = () => onDaySelected(date?.dateString || "");

    return (
      <TouchableOpacity
        onPress={handleDayPress}
        activeOpacity={0.8}
        style={{
          minHeight: 50,
          width: "100%",
          borderRadius: 25,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: isSelected ? "#007AFF" : "transparent",
            borderWidth: 1,
            borderColor: isToday ? "#007AFF" : "transparent",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 25,
          }}
        >
          <Text
            style={{
              color: isSelected
                ? "white"
                : state === "disabled"
                ? "#CCC"
                : isToday
                ? "#007AFF"
                : "black",
              fontWeight: isToday ? "bold" : "normal",
              fontSize: 16,
            }}
          >
            {date?.day}
          </Text>
        </View>
        <View style={{ width: "100%", height: 8 }}>
          {marking?.periods?.map((period: any, index: number) => (
            <View
              key={`${period.color}-${index}-${date?.dateString}`}
              style={{
                borderRadius: 10,
                borderTopLeftRadius: period.startingDay ? 10 : 0,
                borderBottomLeftRadius: period.startingDay ? 10 : 0,
                borderTopRightRadius: period.endingDay ? 10 : 0,
                borderBottomRightRadius: period.endingDay ? 10 : 0,
                backgroundColor: period.color,
                marginHorizontal: 0,
                flex: 1,
              }}
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  }
}

interface CalendarPageProps {
  markedDates: Record<string, MarkingProps>;
  selectedDate: string;
  onDaySelected: (date: string) => void;
}

export const CalendarPage = ({
  markedDates,
  selectedDate,
  onDaySelected,
}: CalendarPageProps) => {
  const { setMonth } = useDateStore();

  const memoizedMarkedDates = useMemo(() => {
    return markedDates;
  }, [markedDates]);

  const handleDayPress = useCallback(
    (day: any) => {
      onDaySelected(day.dateString);
    },
    [onDaySelected]
  );

  const handleMonthChange = useCallback(
    (month: any) => {
      setMonth(month.month);
    },
    [setMonth]
  );

  // dayComponent를 메모이제이션된 함수로 생성
  const dayComponent = useCallback(
    (props: any) => (
      <CustomDayComponent
        {...props}
        onDaySelected={onDaySelected}
        selectedDate={selectedDate}
      />
    ),
    [onDaySelected, selectedDate]
  );

  return (
    <Calendar
      current={selectedDate}
      onDayPress={handleDayPress}
      onMonthChange={handleMonthChange}
      markedDates={memoizedMarkedDates}
      markingType="multi-period"
      firstDay={1}
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
      }}
      dayComponent={dayComponent}
    />
  );
};
