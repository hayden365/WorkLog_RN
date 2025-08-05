import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import {
  RepeatOption,
  ScheduleByDate,
  WorkSession,
  SchedulesById,
  CalendarDisplayMap,
  CalendarDisplayItem,
} from "../models/WorkSession";
import { getSessionColor } from "../utils/colorManager";

// MMKV 스토리지 인스턴스 생성
const storage = new MMKV();

// MMKV 어댑터 생성
const mmkvStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const value = storage.getString(name);
    if (!value) return null;

    const parsed = JSON.parse(value);

    // 스케줄 스토어의 경우 Date 객체와 Set 객체 복원
    if (name === "schedule-store" && parsed.allSchedulesById) {
      Object.keys(parsed.allSchedulesById).forEach((id) => {
        const schedule = parsed.allSchedulesById[id];

        // 배열을 Set 객체로 변환
        if (Array.isArray(schedule.selectedWeekDays)) {
          schedule.selectedWeekDays = new Set(schedule.selectedWeekDays);
        }

        // ISO 문자열을 Date 객체로 변환
        if (typeof schedule.startTime === "string") {
          schedule.startTime = new Date(schedule.startTime);
        }
        if (typeof schedule.endTime === "string") {
          schedule.endTime = new Date(schedule.endTime);
        }
        if (typeof schedule.startDate === "string") {
          schedule.startDate = new Date(schedule.startDate);
        }
        if (typeof schedule.endDate === "string") {
          schedule.endDate = new Date(schedule.endDate);
        }
      });
    }

    return parsed;
  },
  setItem: (name: string, value: unknown) => {
    let serializedValue = value;

    // 스케줄 스토어의 경우 Date 객체와 Set 객체 직렬화
    if (
      name === "schedule-store" &&
      typeof value === "object" &&
      value !== null
    ) {
      const serialized = { ...(value as any) };
      if (serialized.allSchedulesById) {
        Object.keys(serialized.allSchedulesById).forEach((id) => {
          const schedule = serialized.allSchedulesById[id];

          // Set 객체를 배열로 변환
          if (schedule.selectedWeekDays instanceof Set) {
            schedule.selectedWeekDays = Array.from(schedule.selectedWeekDays);
          }

          // Date 객체를 ISO 문자열로 변환
          if (schedule.startTime instanceof Date) {
            schedule.startTime = schedule.startTime.toISOString();
          }
          if (schedule.endTime instanceof Date) {
            schedule.endTime = schedule.endTime.toISOString();
          }
          if (schedule.startDate instanceof Date) {
            schedule.startDate = schedule.startDate.toISOString();
          }
          if (schedule.endDate instanceof Date) {
            schedule.endDate = schedule.endDate.toISOString();
          }
        });
      }
      serializedValue = serialized;
    }

    storage.set(name, JSON.stringify(serializedValue));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
}));

// 스케줄 데이터 버전 관리
const SCHEDULE_STORE_VERSION = 1;

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

// 전체 스케줄 저장 (ID 기반) - 영구 저장 적용
interface ScheduleStore {
  allSchedulesById: SchedulesById;
  addSchedule: (schedule: WorkSession) => void;
  updateSchedule: (id: string, updates: Partial<WorkSession>) => void;
  deleteSchedule: (id: string) => void;
  getScheduleById: (id: string) => WorkSession | undefined;
  getAllSchedules: () => WorkSession[];
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: "schedule-store",
      storage: mmkvStorage,
      version: SCHEDULE_STORE_VERSION,
      // 버전 충돌 시 데이터 병합 로직
      merge: (persistedState: any, currentState) => {
        // 저장된 데이터가 있고 버전이 다르면 병합
        if (persistedState && persistedState.allSchedulesById) {
          return {
            ...currentState,
            allSchedulesById: {
              ...currentState.allSchedulesById,
              ...persistedState.allSchedulesById,
            },
          };
        }
        return currentState;
      },
    }
  )
);

// 일별 스케줄 저장 - 영구 저장 적용
interface DateScheduleStore {
  dateSchedule: ScheduleByDate;
  addDateSchedule: (schedule: ScheduleByDate) => void;
  updateDateSchedule: (date: string, sessionIds: string[]) => void;
  removeDateSchedule: (date: string) => void;
}

export const useDateScheduleStore = create<DateScheduleStore>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "date-schedule-store",
      storage: mmkvStorage,
      version: SCHEDULE_STORE_VERSION,
      merge: (persistedState: any, currentState) => {
        if (persistedState && persistedState.dateSchedule) {
          return {
            ...currentState,
            dateSchedule: {
              ...currentState.dateSchedule,
              ...persistedState.dateSchedule,
            },
          };
        }
        return currentState;
      },
    }
  )
);

// 달력 표시 데이터 스토어 - 영구 저장 적용
interface CalendarDisplayStore {
  calendarDisplayMap: CalendarDisplayMap;
  updateCalendarDisplay: (date: string, items: CalendarDisplayItem[]) => void;
  clearCalendarDisplay: () => void;
  getCalendarDisplayForDate: (date: string) => CalendarDisplayItem[];
}

export const useCalendarDisplayStore = create<CalendarDisplayStore>()(
  persist(
    (set, get) => ({
      calendarDisplayMap: {},
      updateCalendarDisplay: (date, items) =>
        set((state) => ({
          calendarDisplayMap: { ...state.calendarDisplayMap, [date]: items },
        })),
      clearCalendarDisplay: () => set({ calendarDisplayMap: {} }),
      getCalendarDisplayForDate: (date) => get().calendarDisplayMap[date] || [],
    }),
    {
      name: "calendar-display-store",
      storage: mmkvStorage,
      version: SCHEDULE_STORE_VERSION,
      merge: (persistedState: any, currentState) => {
        if (persistedState && persistedState.calendarDisplayMap) {
          return {
            ...currentState,
            calendarDisplayMap: {
              ...currentState.calendarDisplayMap,
              ...persistedState.calendarDisplayMap,
            },
          };
        }
        return currentState;
      },
    }
  )
);

// 스케줄 데이터 관리 유틸리티 함수들
export const scheduleStoreUtils = {
  // 모든 스케줄 데이터 초기화
  clearAllScheduleData: () => {
    storage.delete("schedule-store");
    storage.delete("date-schedule-store");
    storage.delete("calendar-display-store");
  },

  // 저장된 데이터 확인
  getStoredData: () => {
    return {
      scheduleStore: storage.getString("schedule-store"),
      dateScheduleStore: storage.getString("date-schedule-store"),
      calendarDisplayStore: storage.getString("calendar-display-store"),
    };
  },

  // 스케줄 데이터 백업 (JSON 형태로)
  exportScheduleData: () => {
    const scheduleData = storage.getString("schedule-store");
    const dateScheduleData = storage.getString("date-schedule-store");
    const calendarDisplayData = storage.getString("calendar-display-store");

    return {
      scheduleStore: scheduleData ? JSON.parse(scheduleData) : null,
      dateScheduleStore: dateScheduleData ? JSON.parse(dateScheduleData) : null,
      calendarDisplayStore: calendarDisplayData
        ? JSON.parse(calendarDisplayData)
        : null,
      exportDate: new Date().toISOString(),
    };
  },

  // 스케줄 데이터 복원
  importScheduleData: (data: any) => {
    if (data.scheduleStore) {
      storage.set("schedule-store", JSON.stringify(data.scheduleStore));
    }
    if (data.dateScheduleStore) {
      storage.set(
        "date-schedule-store",
        JSON.stringify(data.dateScheduleStore)
      );
    }
    if (data.calendarDisplayStore) {
      storage.set(
        "calendar-display-store",
        JSON.stringify(data.calendarDisplayStore)
      );
    }
  },
};
