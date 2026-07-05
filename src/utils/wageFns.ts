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
    let workMinutes = endMinutes - startMinutes;
    // 종료 시각이 시작 시각보다 이르면 자정을 넘긴 근무이므로 24시간을 더한다
    if (workMinutes < 0) {
      workMinutes += 24 * 60;
    }
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
  // 월급제 세션은 근무일마다 더하면 중복이므로, 그 달에 근무일이 있는 경우
  // 전액을 1회만 반영한다 (발생주의). 여기서 id를 모아 두었다가 마지막에 합산한다.
  const monthlyJobIds = new Set<string>();
  Object.entries(dateSchedule).forEach(([date, sessionIds]) => {
    const dateObj = new Date(date);
    if (
      dateObj.getMonth() === viewMonth.getMonth() &&
      dateObj.getFullYear() === viewMonth.getFullYear()
    ) {
      for (const id of sessionIds) {
        const session = allSchedulesById[id];
        if (!session) continue;
        if (session.wageType === "monthly") {
          monthlyJobIds.add(id);
        } else if (session.calculatedDailyWage !== null) {
          // 시급·일급: 미리 계산된 일급을 근무일마다 더한다
          total += session.calculatedDailyWage;
        }
      }
    }
  });

  monthlyJobIds.forEach((id) => {
    total += allSchedulesById[id].wage;
  });

  return total;
};
