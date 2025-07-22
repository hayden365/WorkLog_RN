import React, { useState } from "react";
import { Calendar } from "react-native-calendars";
import { WorkSession } from "../models/WorkSession";
import dayjs from "dayjs";
import { useDateStore } from "../store/dateStore";

interface CalendarPageProps {
  eventsMap: Record<string, WorkSession[]>;
  onDaySelected: (date: string) => void;
}

export const CalendarPage = ({
  eventsMap,
  onDaySelected,
}: CalendarPageProps) => {
  const [selectedDay, setSelectedDay] = useState(dayjs().format("YYYY-MM-DD"));
  const { setMonth } = useDateStore();
  const markedDates: Record<string, any> = {
    [selectedDay]: {
      selected: true,
      selectedColor: "#000000",
    },
  };

  // 이벤트 점 추가
  Object.keys(eventsMap).forEach((dateKey) => {
    if (!markedDates[dateKey]) {
      markedDates[dateKey] = { marked: true, dotColor: "#ff2d55" };
    } else {
      markedDates[dateKey].marked = true;
      markedDates[dateKey].dotColor = "#ff2d55";
    }
  });

  return (
    <Calendar
      current={selectedDay}
      onDayPress={(day) => {
        setSelectedDay(day.dateString);
        onDaySelected(day.dateString);
      }}
      onMonthChange={(month) => {
        setMonth(month.month.toString() + "월");
      }}
      markedDates={markedDates}
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
