import {
  ScheduleByDate,
  SchedulesById,
  WorkSession,
} from "../models/WorkSession";
import { useScheduleStore } from "../store/shiftStore";

// 시급-> 일급 계산 유틸리티 함수 : calculateDailyWage에 들어갈 값.
export const calculateDailyWage = (session: WorkSession): number | null => {
  if (session.wageType === "daily") {
    return session.wage;
  } else if (session.wageType === "hourly") {
    const startMinutes =
      session.startTime.getHours() * 60 + session.startTime.getMinutes();
    const endMinutes =
      session.endTime.getHours() * 60 + session.endTime.getMinutes();
    const workMinutes = endMinutes - startMinutes;
    const workHours = workMinutes / 60;
    return workHours * session.wage;
  } else if (session.wageType === "monthly") {
    // 월급은 일별로 나누어 계산 (간단한 방식)
    return null;
  }
  return null;
};

export const displayMonthlyWage = (
  dateSchedule: ScheduleByDate,
  allSchedulesById: SchedulesById,
  viewMonth: Date
): number => {
  let total = 0;
  Object.entries(dateSchedule).forEach(([date, sessionIds]) => {
    const dateObj = new Date(date);
    if (
      dateObj.getMonth() === viewMonth.getMonth() &&
      dateObj.getFullYear() === viewMonth.getFullYear()
    ) {
      for (const id of sessionIds) {
        const session = allSchedulesById[id];
        // session이 존재하고 calculatedDailyWage가 null이 아닌 경우에만 더하기
        if (session && session.calculatedDailyWage !== null) {
          total += session.calculatedDailyWage;
        }
      }
    }
  });
  return total;
};
