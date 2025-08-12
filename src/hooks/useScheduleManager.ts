import {
  useScheduleStore,
  useDateScheduleStore,
  useCalendarDisplayStore,
  scheduleStoreUtils,
} from "../store/shiftStore";
import { WorkSession } from "../models/WorkSession";
import { calculateDailyWage } from "../utils/wageFns";
import { getSessionColor } from "../utils/colorManager";
import { useDateStore } from "../store/dateStore";
import uuid from "react-native-uuid";

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

  const {
    dateSchedule,
    addDateSchedule,
    updateDateSchedule,
    removeDateSchedule,
    clear: clearDateSchedule, // clear 함수 추가
  } = useDateScheduleStore();

  const {
    calendarDisplayMap,
    updateCalendarDisplay,
    clearCalendarDisplay,
    getCalendarDisplayForDate,
  } = useCalendarDisplayStore();

  // 시급이 계산된 세션 추가
  const addScheduleWithCalculatedWage = (schedule: Partial<WorkSession>) => {
    const wage = calculateDailyWage(schedule as WorkSession);

    const id = uuid.v4();
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

  // 스케줄 삭제 시 관련 데이터도 함께 정리
  const deleteScheduleWithCleanup = (id: string) => {
    // 스케줄 삭제
    deleteSchedule(id);

    clearDateSchedule();
    clearCalendarDisplay();
  };

  // 모든 스케줄 데이터 초기화
  const clearAllData = () => {
    scheduleStoreUtils.clearAllScheduleData();
  };

  // 스케줄 데이터 백업
  const exportData = () => {
    return scheduleStoreUtils.exportScheduleData();
  };

  // 스케줄 데이터 복원
  const importData = (data: any) => {
    scheduleStoreUtils.importScheduleData(data);
  };

  // 저장된 데이터 상태 확인
  const getStorageStatus = () => {
    return scheduleStoreUtils.getStoredData();
  };

  return {
    // 기존 스케줄 관련 상태와 함수들
    allSchedulesById,
    dateSchedule,
    calendarDisplayMap,
    addSchedule: addScheduleWithCalculatedWage,
    updateSchedule: updateScheduleWithCalculatedWage,
    deleteSchedule: deleteScheduleWithCleanup,
    getScheduleById,
    getAllSchedules,

    // 날짜 스케줄 관련 함수들
    addDateSchedule,
    updateDateSchedule,
    removeDateSchedule,

    // 달력 표시 관련 함수들
    updateCalendarDisplay,
    clearCalendarDisplay,
    getCalendarDisplayForDate,

    // 데이터 관리 유틸리티 함수들
    clearAllData,
    exportData,
    importData,
    getStorageStatus,
  };
};
