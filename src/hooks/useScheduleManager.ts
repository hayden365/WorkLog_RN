import { useCallback } from "react";
import {
  useScheduleStore,
  useDateScheduleStore,
  useCalendarDisplayStore,
} from "../store/shiftStore";
import { WorkSession } from "../models/WorkSession";
import {
  generateMonthlyScheduleData,
  generateCalendarDisplayMap,
} from "../utils/calendarFns";

export const useScheduleManager = () => {
  const {
    schedulesById,
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
  } = useDateScheduleStore();

  const { calendarDisplayMap, updateCalendarDisplay, clearCalendarDisplay } =
    useCalendarDisplayStore();

  // 스케줄 추가
  const addNewSchedule = useCallback(
    (schedule: WorkSession) => {
      addSchedule(schedule);
    },
    [addSchedule]
  );

  // 스케줄 수정
  const editSchedule = useCallback(
    (id: string, updates: Partial<WorkSession>) => {
      updateSchedule(id, updates);
    },
    [updateSchedule]
  );

  // 스케줄 삭제
  const removeSchedule = useCallback(
    (id: string) => {
      deleteSchedule(id);
    },
    [deleteSchedule]
  );

  // 특정 날짜의 스케줄 조회
  const getSchedulesForDate = useCallback(
    (date: string): WorkSession[] => {
      const sessionIds = dateSchedule[date] || [];
      return sessionIds
        .map((id) => schedulesById[id])
        .filter(Boolean) as WorkSession[];
    },
    [dateSchedule, schedulesById]
  );

  // 월별 스케줄 데이터 생성
  const generateMonthData = useCallback(
    (viewMonth: Date) => {
      const allSchedules = getAllSchedules();
      const { markedDates, dateSchedule: newDateSchedule } =
        generateMonthlyScheduleData(allSchedules, viewMonth);

      const newCalendarDisplayMap = generateCalendarDisplayMap(
        newDateSchedule,
        schedulesById
      );

      return {
        markedDates,
        dateSchedule: newDateSchedule,
        calendarDisplayMap: newCalendarDisplayMap,
      };
    },
    [getAllSchedules, schedulesById]
  );

  // 스케줄 통계 계산
  const calculateScheduleStats = useCallback(() => {
    const allSchedules = getAllSchedules();

    const totalSchedules = allSchedules.length;
    const totalEarnings = allSchedules.reduce((total, session) => {
      const startMinutes =
        session.startTime.getHours() * 60 + session.startTime.getMinutes();
      const endMinutes =
        session.endTime.getHours() * 60 + session.endTime.getMinutes();
      const workHours = (endMinutes - startMinutes) / 60;
      return total + workHours * session.wage;
    }, 0);

    const totalWorkHours = allSchedules.reduce((total, session) => {
      const startMinutes =
        session.startTime.getHours() * 60 + session.startTime.getMinutes();
      const endMinutes =
        session.endTime.getHours() * 60 + session.endTime.getMinutes();
      return total + (endMinutes - startMinutes) / 60;
    }, 0);

    return {
      totalSchedules,
      totalEarnings: Math.round(totalEarnings),
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
    };
  }, [getAllSchedules]);

  // 스케줄 검색
  const searchSchedules = useCallback(
    (query: string): WorkSession[] => {
      const allSchedules = getAllSchedules();
      const lowerQuery = query.toLowerCase();

      return allSchedules.filter(
        (schedule) =>
          schedule.jobName.toLowerCase().includes(lowerQuery) ||
          schedule.description.toLowerCase().includes(lowerQuery)
      );
    },
    [getAllSchedules]
  );

  // 반복 스케줄 생성
  const createRecurringSchedules = useCallback(
    (
      baseSchedule: WorkSession,
      startDate: Date,
      endDate: Date
    ): WorkSession[] => {
      const schedules: WorkSession[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const newSchedule: WorkSession = {
          ...baseSchedule,
          id: `${baseSchedule.id}_${currentDate.getTime()}`,
          startDate: new Date(currentDate),
          endDate: new Date(currentDate),
        };

        schedules.push(newSchedule);

        // 다음 날짜 계산
        switch (baseSchedule.repeatOption) {
          case "daily":
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case "weekly":
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case "biweekly":
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case "triweekly":
            currentDate.setDate(currentDate.getDate() + 21);
            break;
          case "monthly":
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      return schedules;
    },
    []
  );

  return {
    // 데이터
    schedulesById,
    dateSchedule,
    calendarDisplayMap,

    // 기본 CRUD
    addNewSchedule,
    editSchedule,
    removeSchedule,
    getScheduleById,
    getAllSchedules,

    // 조회 함수
    getSchedulesForDate,
    searchSchedules,

    // 데이터 생성
    generateMonthData,

    // 통계
    calculateScheduleStats,

    // 유틸리티
    createRecurringSchedules,
  };
};
