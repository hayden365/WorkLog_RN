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
  getDate,
  addDays,
  isWithinInterval,
  getDaysInMonth,
  lastDayOfMonth,
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

export function getMarkedDatesFromNoneSchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}): Record<string, CalendarDisplayItem> {
  const markedDates: Record<string, CalendarDisplayItem> = {};
  const sessionColor = schedule.color || getSessionColor(schedule.id);
  const startDate = schedule.startDate;
  const endDate = schedule.endDate ?? schedule.startDate;

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const matchedDates = days
    .filter((day) => {
      return isWithinInterval(day, { start: startDate, end: endDate });
    })
    .map((d) => format(d, "yyyy-MM-dd"));

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

// repeatOption is daily
export function getMarkedDatesFromDailySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}): Record<string, CalendarDisplayItem> {
  const markedDates: Record<string, CalendarDisplayItem> = {};
  const startDate = schedule.startDate;
  const endDate = schedule.endDate ?? endOfMonth(addMonths(viewMonth, 2));

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
  const startDate = schedule.startDate;
  const endDate = schedule.endDate ?? endOfMonth(addMonths(viewMonth, 2));

  const selectedWeekDays = Array.from(schedule.selectedWeekDays);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const matchedDates = days
    .filter((day) => {
      const dayOfWeek = getDay(day);
      return (
        selectedWeekDays.includes(dayOfWeek) &&
        isWithinInterval(day, {
          start: startDate,
          end: endDate,
        })
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

export function getMarkedDatesFromBiweeklySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}): Record<string, CalendarDisplayItem> {
  const markedDates: Record<string, CalendarDisplayItem> = {};
  const startDate = schedule.startDate;
  const endDate = schedule.endDate ?? endOfMonth(addMonths(viewMonth, 2));
  const sessionColor = schedule.color || getSessionColor(schedule.id);
  const selectedWeekDays = Array.from(schedule.selectedWeekDays);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);

  for (
    let baseDate = new Date(startDate);
    isBefore(baseDate, endDate) || isSameDay(baseDate, endDate);
    baseDate = addDays(baseDate, 14)
  ) {
    selectedWeekDays.forEach((dayOfWeek) => {
      const date = addDays(baseDate, dayOfWeek - getDay(baseDate));

      if (
        isWithinInterval(date, { start: monthStart, end: monthEnd }) &&
        isWithinInterval(date, { start: startDate, end: endDate })
      ) {
        const dateStr = format(date, "yyyy-MM-dd");
        markedDates[dateStr] = {
          color: sessionColor,
          selected: true,
          sessionId: schedule.id,
          jobName: schedule.jobName,
        };
      }
    });
  }

  return markedDates;
}

//  schedule's repeatOption is monthly
export function getMarkedDatesFromMonthlySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}): Record<string, CalendarDisplayItem> {
  const markedDates: Record<string, CalendarDisplayItem> = {};
  const sessionColor = schedule.color || getSessionColor(schedule.id);

  const startDate = schedule.startDate;
  const endDate = schedule.endDate;

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);

  const monthStartDate = getDate(startDate);
  const monthEndDate = endDate ? getDate(endDate) : null;

  const lastDayOfThisMonth = getDate(lastDayOfMonth(viewMonth));

  const intervalStart = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    Math.min(monthStartDate, lastDayOfThisMonth)
  );

  const intervalEnd =
    monthEndDate !== null
      ? new Date(
          viewMonth.getFullYear(),
          viewMonth.getMonth(),
          Math.min(monthEndDate, lastDayOfThisMonth)
        )
      : intervalStart;

  if (
    isAfter(intervalEnd, schedule.startDate) ||
    isSameDay(intervalEnd, schedule.startDate)
  ) {
    const days = eachDayOfInterval({ start: intervalStart, end: intervalEnd });

    days.forEach((day) => {
      const formatted = format(day, "yyyy-MM-dd");

      if (
        isWithinInterval(day, {
          start: schedule.startDate,
          end: schedule.endDate ?? new Date("9999-12-31"), // 무제한
        })
      ) {
        markedDates[formatted] = {
          color: sessionColor,
          selected: true,
          sessionId: schedule.id,
          jobName: schedule.jobName,
        };
      }
    });
  }

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
      case "none":
        sessionMarkedDates = getMarkedDatesFromNoneSchedule({
          schedule: session,
          viewMonth,
        });
        sessionDates = Object.keys(sessionMarkedDates);
        break;
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
      case "biweekly":
        sessionMarkedDates = getMarkedDatesFromBiweeklySchedule({
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
