import { create } from "zustand";
import {
  RepeatOption,
  ScheduleByDate,
  WorkSession,
  SchedulesById,
  CalendarDisplayMap,
  CalendarDisplayItem,
} from "../models/WorkSession";
import { getSessionColor } from "../utils/colorManager";

interface ShiftStore {
  jobName: string;
  setJobName: (jobName: string) => void;
  wage: number;
  setWage: (wage: number) => void;
  startDate: Date;
  setStartDate: (date: Date) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
  startTime: Date;
  setStartTime: (startTime: Date) => void;
  endTime: Date;
  setEndTime: (endTime: Date) => void;
  repeatOption: RepeatOption;
  setRepeatOption: (repeatOption: RepeatOption) => void;
  selectedWeekDays: Set<number>;
  setSelectedWeekDays: (weekDays: Set<number>) => void;
  description: string;
  setDescription: (description: string) => void;
  reset: () => void;
}

export const useShiftStore = create<ShiftStore>((set) => ({
  jobName: "",
  setJobName: (jobName) => set({ jobName }),
  wage: 0,
  setWage: (wage) => set({ wage }),
  startDate: new Date(),
  setStartDate: (startDate) => set({ startDate }),
  endDate: new Date(),
  setEndDate: (endDate) => set({ endDate }),
  startTime: new Date(),
  setStartTime: (startTime) => set({ startTime }),
  endTime: new Date(),
  setEndTime: (endTime) => set({ endTime }),
  repeatOption: "daily",
  setRepeatOption: (repeatOption) => set({ repeatOption }),
  selectedWeekDays: new Set(),
  setSelectedWeekDays: (selectedWeekDays) => set({ selectedWeekDays }),
  description: "",
  setDescription: (description) => set({ description }),
  reset: () =>
    set({
      jobName: "",
      wage: 0,
      startDate: new Date(),
      endDate: new Date(),
      startTime: new Date(),
      endTime: new Date(),
      repeatOption: "daily",
      selectedWeekDays: new Set(),
      description: "",
    }),
}));

// 전체 스케줄 저장 (ID 기반)
interface ScheduleStore {
  allSchedulesById: SchedulesById;
  addSchedule: (schedule: WorkSession) => void;
  updateSchedule: (id: string, updates: Partial<WorkSession>) => void;
  deleteSchedule: (id: string) => void;
  getScheduleById: (id: string) => WorkSession | undefined;
  getAllSchedules: () => WorkSession[];
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  allSchedulesById: {},
  addSchedule: (schedule) =>
    set((state) => {
      const newSchedule = {
        ...schedule,
        color: schedule.color || getSessionColor(schedule.id),
      };
      return {
        allSchedulesById: {
          ...state.allSchedulesById,
          [schedule.id]: newSchedule,
        },
      };
    }),
  updateSchedule: (id, updates) =>
    set((state) => ({
      allSchedulesById: {
        ...state.allSchedulesById,
        [id]: { ...state.allSchedulesById[id], ...updates },
      },
    })),
  deleteSchedule: (id) =>
    set((state) => {
      const { [id]: deleted, ...remaining } = state.allSchedulesById;
      return { allSchedulesById: remaining };
    }),
  getScheduleById: (id) => get().allSchedulesById[id],
  getAllSchedules: () => Object.values(get().allSchedulesById),
}));

// 일별 스케줄 저장
interface DateScheduleStore {
  dateSchedule: ScheduleByDate;
  addDateSchedule: (schedule: ScheduleByDate) => void;
  updateDateSchedule: (date: string, sessionIds: string[]) => void;
  removeDateSchedule: (date: string) => void;
}

export const useDateScheduleStore = create<DateScheduleStore>((set) => ({
  dateSchedule: {},
  addDateSchedule: (schedule) =>
    set((state) => ({
      dateSchedule: { ...state.dateSchedule, ...schedule },
    })),
  updateDateSchedule: (date, sessionIds) =>
    set((state) => ({
      dateSchedule: { ...state.dateSchedule, [date]: sessionIds },
    })),
  removeDateSchedule: (date) =>
    set((state) => {
      const { [date]: removed, ...remaining } = state.dateSchedule;
      return { dateSchedule: remaining };
    }),
}));

// 달력 표시 데이터 스토어
interface CalendarDisplayStore {
  calendarDisplayMap: CalendarDisplayMap;
  updateCalendarDisplay: (date: string, items: CalendarDisplayItem[]) => void;
  clearCalendarDisplay: () => void;
  getCalendarDisplayForDate: (date: string) => CalendarDisplayItem[];
}

export const useCalendarDisplayStore = create<CalendarDisplayStore>(
  (set, get) => ({
    calendarDisplayMap: {},
    updateCalendarDisplay: (date, items) =>
      set((state) => ({
        calendarDisplayMap: { ...state.calendarDisplayMap, [date]: items },
      })),
    clearCalendarDisplay: () => set({ calendarDisplayMap: {} }),
    getCalendarDisplayForDate: (date) => get().calendarDisplayMap[date] || [],
  })
);
