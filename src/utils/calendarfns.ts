import {
  eachDayOfInterval,
  format,
  getDay,
  isBefore,
  parseISO,
  startOfMonth,
  endOfMonth,
  isAfter,
  addMonths,
  isSameDay,
} from "date-fns";
import {
  ScheduleByDate,
  WorkSession,
  CalendarDisplayItem,
} from "../models/WorkSession";
import { getSessionColor } from "./colorManager";

// 날짜별 스케줄 인덱싱 함수
export function calculateScheduleByDate(
  dates: string[],
  sessionId: string,
  existingSchedule: ScheduleByDate
): ScheduleByDate {
  const scheduleByDate: ScheduleByDate = { ...existingSchedule };
  dates.forEach((date) => {
    if (scheduleByDate[date] && !scheduleByDate[date].includes(sessionId)) {
      scheduleByDate[date] = [...scheduleByDate[date], sessionId];
    } else if (!scheduleByDate[date]) {
      scheduleByDate[date] = [sessionId];
    }
  });
  return scheduleByDate;
}

// 타입 정의 추가
interface Period {
  startingDay: boolean;
  endingDay: boolean;
  color: string;
}

interface MarkedDate {
  periods: Period[];
}

// repeatOption is daily
export function getMarkedDatesFromDailySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}): Record<string, CalendarDisplayItem> {
  const markedDates: Record<string, CalendarDisplayItem> = {};
  const startDate = parseISO(schedule.startDate.toISOString());
  const endDate = schedule.endDate
    ? parseISO(schedule.endDate.toISOString())
    : endOfMonth(addMonths(viewMonth, 2));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const matchedDates = days
    .filter((day) => {
      return (
        (isAfter(day, startDate) || isSameDay(day, startDate)) &&
        (isBefore(day, endDate) || isSameDay(day, endDate))
      );
    })
    .map((d) => format(d, "yyyy-MM-dd"));

  const sessionColor = schedule.color || getSessionColor(schedule.id);

  matchedDates.forEach((dateStr: string) => {
    (markedDates as Record<string, CalendarDisplayItem>)[dateStr] = {
      color: sessionColor,
      selected: true,
      sessionId: schedule.id,
      jobName: schedule.jobName,
    };
  });

  return markedDates;
}

// // schedule's repeatOption is weekly
export function getMarkedDatesFromWeeklySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}): Record<string, CalendarDisplayItem> {
  const markedDates: Record<string, CalendarDisplayItem> = {};
  const startDate = parseISO(schedule.startDate.toISOString());
  const endDate = schedule.endDate
    ? parseISO(schedule.endDate.toISOString())
    : null;
  const selectedWeekDays = [...schedule.selectedWeekDays];
  const monthStart = startOfMonth(new Date(viewMonth));
  const monthEnd = endOfMonth(new Date(viewMonth));

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const matchedDates = days
    .filter((day) => {
      const dayOfWeek = getDay(day);
      return (
        selectedWeekDays.includes(dayOfWeek) &&
        !isBefore(day, startDate) &&
        (!endDate || !isBefore(day, endDate))
      );
    })
    .map((d) => format(d, "yyyy-MM-dd"));

  const sessionColor = schedule.color || getSessionColor(schedule.id);

  matchedDates.forEach((dateStr: string) => {
    markedDates[dateStr] = {
      color: sessionColor,
      selected: true,
      sessionId: schedule.id,
      jobName: schedule.jobName,
    };
  });

  return markedDates;
}

// // schedule's repeatOption is monthly
export function getMarkedDatesFromMonthlySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}): Record<string, CalendarDisplayItem> {
  const markedDates: Record<string, CalendarDisplayItem> = {};
  const startDate = parseISO(schedule.startDate.toISOString());
  const endDate = schedule.endDate
    ? parseISO(schedule.endDate.toISOString())
    : null;
  const selectedDays = [...schedule.selectedWeekDays];
  const monthStart = startOfMonth(new Date(viewMonth));
  const monthEnd = endOfMonth(new Date(viewMonth));

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const matchedDates = days
    .filter((day) => {
      const dayOfMonth = day.getDate();
      return (
        selectedDays.includes(dayOfMonth) &&
        !isBefore(day, startDate) &&
        (!endDate || !isBefore(day, endDate))
      );
    })
    .map((d) => format(d, "yyyy-MM-dd"));

  const sessionColor = schedule.color || getSessionColor(schedule.id);

  matchedDates.forEach((dateStr: string) => {
    markedDates[dateStr] = {
      color: sessionColor,
      selected: true,
      sessionId: schedule.id,
      jobName: schedule.jobName,
    };
  });

  return markedDates;
}

// 월별 스케줄 데이터 생성 함수
export function generateViewMonthScheduleData(
  schedules: WorkSession[],
  viewMonth: Date
): {
  markedDates: Record<string, CalendarDisplayItem[]>;
  dateSchedule: ScheduleByDate;
} {
  const markedDates: Record<string, CalendarDisplayItem[]> = {};
  const dateSchedule: ScheduleByDate = {};

  schedules.forEach((session) => {
    let sessionMarkedDates: Record<string, CalendarDisplayItem> = {};
    let sessionDates: string[] = [];

    switch (session.repeatOption) {
      case "daily":
        sessionMarkedDates = getMarkedDatesFromDailySchedule({
          schedule: session,
          viewMonth,
        });
        sessionDates = Object.keys(sessionMarkedDates);
        break;
      case "weekly":
        sessionMarkedDates = getMarkedDatesFromWeeklySchedule({
          schedule: session,
          viewMonth,
        });
        sessionDates = Object.keys(sessionMarkedDates);
        break;
      case "monthly":
        sessionMarkedDates = getMarkedDatesFromMonthlySchedule({
          schedule: session,
          viewMonth,
        });
        sessionDates = Object.keys(sessionMarkedDates);
        break;
      default:
        break;
    }

    // markedDates 병합
    Object.entries(sessionMarkedDates).forEach(([date, markedDate]) => {
      if (markedDates[date]) {
        markedDates[date].push(markedDate);
      } else {
        markedDates[date] = [markedDate] as CalendarDisplayItem[];
      }
    });

    // dateSchedule 업데이트
    sessionDates.forEach((date) => {
      if (dateSchedule[date]) {
        if (!dateSchedule[date].includes(session.id)) {
          dateSchedule[date] = [...dateSchedule[date], session.id];
        }
      } else {
        dateSchedule[date] = [session.id];
      }
    });
  });

  return { markedDates, dateSchedule };
}
