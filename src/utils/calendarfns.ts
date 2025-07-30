import {
  eachDayOfInterval,
  format,
  getDay,
  isBefore,
  parseISO,
} from "date-fns";
import { ScheduleByDate, WorkSession } from "../models/WorkSession";

export function calculateScheduleByDate(
  dates: string[],
  sessionId: string,
  existingSchedule: ScheduleByDate
): ScheduleByDate {
  const scheduleByDate: ScheduleByDate = { ...existingSchedule };
  dates.forEach((date) => {
    if (scheduleByDate[date] && !scheduleByDate[date].includes(sessionId)) {
      scheduleByDate[date] = [...scheduleByDate[date], sessionId];
    } else {
      scheduleByDate[date] = [sessionId];
    }
  });
  return scheduleByDate;
}

// repeatOption is daily
export function getMarkedDatesFromDailySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}) {
  const markedDates = {};
  const startDate = parseISO(schedule.startDate.toISOString());
  const endDate = schedule.endDate
    ? parseISO(schedule.endDate.toISOString())
    : null;
}

function groupDatesByConsecutiveChunks(dates: string[]) {
  const sorted = [...dates].sort();
  const chunks = [];

  let currentChunk = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);

    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      currentChunk.push(sorted[i]);
    } else {
      chunks.push(currentChunk);
      currentChunk = [sorted[i]];
    }
  }
  chunks.push(currentChunk);
  return chunks;
}

// schedule's repeatOption is weekly
export function getMarkedDatesFromWeeklySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}) {
  const markedDates = {};
  const startDate = parseISO(schedule.startDate.toISOString());
  const endDate = schedule.endDate
    ? parseISO(schedule.endDate.toISOString())
    : null;
  const selectedWeekDays = [...schedule.selectedWeekDays];
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0
  );

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const matchedDates = days
    .filter((day) => {
      const dayOfWeek = getDay(day);
      return (
        selectedWeekDays.includes(dayOfWeek) &&
        !isBefore(day, startDate) &&
        (!endDate || isBefore(day, endDate))
      );
    })
    .map((d) => format(d, "yyyy-MM-dd"));

  const dateChunks: string[][] =
    groupDatesByConsecutiveChunks(matchedDates) ?? [];

  dateChunks.forEach((chunk: string[]) => {
    chunk.forEach((dateStr: string, idx: number) => {
      (markedDates as Record<string, any>)[dateStr] = {
        periods: [
          {
            startingDay: idx === 0,
            endingDay: idx === chunk.length - 1,
            color: "#f0e68c",
          },
        ],
      };
    });
  });

  return markedDates;
}

// schedule's repeatOption is monthly
export function getMarkedDatesFromMonthlySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}) {
  const markedDates = {};
  const startDate = parseISO(schedule.startDate.toISOString());
  const endDate = schedule.endDate
    ? parseISO(schedule.endDate.toISOString())
    : null;
  const selectedDays = [...schedule.selectedWeekDays];
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0
  );

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const matchedDates = days
    .filter((day) => {
      const dayOfMonth = day.getDate();
      return (
        selectedDays.includes(dayOfMonth) &&
        !isBefore(day, startDate) &&
        (!endDate || isBefore(day, endDate))
      );
    })
    .map((d) => format(d, "yyyy-MM-dd"));

  const dateChunks: string[][] =
    groupDatesByConsecutiveChunks(matchedDates) ?? [];

  dateChunks.forEach((chunk: string[]) => {
    chunk.forEach((dateStr: string, idx: number) => {
      (markedDates as Record<string, any>)[dateStr] = {
        periods: [
          {
            startingDay: idx === 0,
            endingDay: idx === chunk.length - 1,
            color: "#f0e68c",
          },
        ],
      };
    });
  });

  return markedDates;
}
