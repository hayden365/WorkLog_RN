import React, { useState } from "react";
import { Calendar } from "react-native-calendars";
import { WorkSession } from "../models/WorkSession";
import dayjs from "dayjs";
import { useDateStore } from "../store/dateStore";
import { repeatOptions } from "../utils/repeatOptions";
import { MarkingProps } from "react-native-calendars/src/calendar/day/marking";

interface CalendarPageProps {
  markedDates: Record<string, MarkingProps>;
  onDaySelected: (date: string) => void;
}

export const CalendarPage = ({
  markedDates,
  onDaySelected,
}: CalendarPageProps) => {
  const [selectedDay, setSelectedDay] = useState(dayjs().format("YYYY-MM-DD"));
  const { setMonth } = useDateStore();

  return (
    <Calendar
      current={selectedDay}
      onDayPress={(day) => {
        setSelectedDay(day.dateString);
        onDaySelected(day.dateString);
      }}
      onMonthChange={(month) => {
        setMonth(month.month);
      }}
      markedDates={markedDates}
      markingType="multi-period"
      firstDay={1}
      theme={{
        todayTextColor: "#007aff",
        selectedDayBackgroundColor: "#000000",
        selectedDayTextColor: "#ffffff",
        dotColor: "#ff2d55",
        textSectionTitleColor: "#1c1c1e",
        textDayHeaderFontWeight: "600",
        textDayFontWeight: "400",
        textDayFontSize: 16,
        textMonthFontSize: 20,
        textMonthFontWeight: "600",
        arrowColor: "#000",
      }}
    />
  );
};
