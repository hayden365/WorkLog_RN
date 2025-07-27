import React, { useState } from "react";
import { Calendar } from "react-native-calendars";
import { WorkSession } from "../models/WorkSession";
import dayjs from "dayjs";
import { useDateStore } from "../store/dateStore";
import { repeatOptions } from "../utils/repeatOptions";

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
  // 매주 반복 -> selectedWeekDays 0~6 값은 월~일 값을 의미함. startDate부터 endDate가 있다면, endDate까지 이벤트 반복.endDate가 없다면, 표시되는 날짜까지 반복.
  const generateMarkedDates = () => {
    const markedDates: Record<string, any> = {
      [selectedDay]: {
        selected: true,
        selectedColor: "#000000",
      },
    };
    Object.keys(eventsMap).forEach((dateKey) => {
      if (!markedDates[dateKey]) {
        markedDates[dateKey] = {
          periods: [{ startingDay: true, endingDay: false, color: "#ff2d55" }],
        };
      } else {
        markedDates[dateKey].periods = [
          ...(markedDates[dateKey].periods || []),
          { startingDay: true, endingDay: false, color: "#ff2d55" },
        ];
      }
    });

    const weeklyEvents: Record<string, any> = {};

    Object.values(eventsMap)
      .flat()
      .forEach((schedule) => {
        if (
          schedule.repeatOption === "weekly" &&
          schedule.selectedWeekDays.size > 0
        ) {
          const startDate = dayjs(schedule.startDate);
          const endDate = schedule.endDate
            ? dayjs(schedule.endDate)
            : dayjs().add(5, "year");

          let currentDate = startDate;
          while (
            currentDate.isBefore(endDate) ||
            currentDate.isSame(endDate, "day")
          ) {
            const dayOfWeek = currentDate.day();

            if (schedule.selectedWeekDays.has(dayOfWeek)) {
              const dateString = currentDate.format("YYYY-MM-DD");

              if (!weeklyEvents[dateString]) {
                weeklyEvents[dateString] = {
                  periods: [
                    { startingDay: true, endingDay: false, color: "#ff2d55" },
                  ],
                };
              } else {
                weeklyEvents[dateString].periods.push({
                  startingDay: true,
                  endingDay: false,
                  color: "#ff2d55",
                });
              }
            }

            currentDate = currentDate.add(1, "week");
          }
        }
      });

    Object.keys(weeklyEvents).forEach((dateKey) => {
      if (!markedDates[dateKey]) {
        markedDates[dateKey] = weeklyEvents[dateKey];
      } else {
        markedDates[dateKey].periods = [
          ...(markedDates[dateKey].periods || []),
          ...weeklyEvents[dateKey].periods,
        ];
      }
    });

    return markedDates;
  };

  const markedDates = generateMarkedDates();

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
