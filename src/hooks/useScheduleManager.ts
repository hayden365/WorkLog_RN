import { useScheduleStore } from "../store/shiftStore";
import { WorkSession } from "../models/WorkSession";
import { calculateDailyWage } from "../utils/wageFns";
import { getSessionColor } from "../utils/colorManager";
import { v4 as uuidv4 } from "uuid";

// 비즈니스 로직 관리 훅
export const useScheduleManager = () => {
  const {
    allSchedulesById,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleById,
    getAllSchedules,
  } = useScheduleStore();

  // 시급이 계산된 세션 추가
  const addScheduleWithCalculatedWage = (schedule: Partial<WorkSession>) => {
    const wage = calculateDailyWage(schedule as WorkSession);

    const id = uuidv4();
    addSchedule({
      ...schedule,
      id,
      calculatedDailyWage: wage,
      color: getSessionColor(id),
    } as WorkSession);
  };

  // 시급이 계산된 세션 업데이트
  const updateScheduleWithCalculatedWage = (
    id: string,
    updates: Partial<WorkSession>
  ) => {
    const currentSession = allSchedulesById[id];
    if (currentSession) {
      const updatedSession = { ...currentSession, ...updates };
      const wage = calculateDailyWage(updatedSession);
      updateSchedule(id, { ...updatedSession, calculatedDailyWage: wage });
    }
  };

  return {
    allSchedulesById,
    addSchedule: addScheduleWithCalculatedWage,
    updateSchedule: updateScheduleWithCalculatedWage,
    deleteSchedule,
    getScheduleById,
    getAllSchedules,
  };
};
