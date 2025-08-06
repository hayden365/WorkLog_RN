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

const SCHEDULE_STORE_VERSION = 1;
const STORE_NAMES = {
  SCHEDULE: "schedule-store",
  DATE_SCHEDULE: "date-schedule-store",
  CALENDAR_DISPLAY: "calendar-display-store",
};

type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

// MMKV 스토리지 인스턴스 생성
const storage = new MMKV();

// MMKV 어댑터 생성: zustand persist middleware와 호환
const mmkvStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const value = storage.getString(name);
    if (!value) return null;

    const parsed = JSON.parse(value);

    // 스케줄 스토어의 경우 Date 객체와 Set 객체 복원
    if (name === STORE_NAMES.SCHEDULE && parsed.allSchedulesById) {
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
      name === STORE_NAMES.SCHEDULE &&
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

const createPersistConfig = (name: StoreName) => ({
  name: name,
  storage: mmkvStorage,
  version: SCHEDULE_STORE_VERSION,
  merge: (persistedState: any, currentState: any) => {
    if (persistedState && Object.keys(persistedState).length > 0) {
      return {
        ...currentState,
        ...persistedState,
      };
    }
    return currentState;
  },
});

// 임시 저장 스토어
interface ShiftStore {
  jobName: string;
  wage: number;
  startDate: Date;
  endDate: Date;
  startTime: Date;
  endTime: Date;
  repeatOption: RepeatOption;
  selectedWeekDays: Set<number>;
  description: string;

  setJobName: (jobName: string) => void;
  setWage: (wage: number) => void;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  setStartTime: (startTime: Date) => void;
  setEndTime: (endTime: Date) => void;
  setRepeatOption: (repeatOption: RepeatOption) => void;
  setSelectedWeekDays: (weekDays: Set<number>) => void;
  setDescription: (description: string) => void;
  reset: () => void;
}

const createInitialShiftState = (): Omit<
  ShiftStore,
  keyof {
    setJobName: never;
    setWage: never;
    setStartDate: never;
    setEndDate: never;
    setStartTime: never;
    setEndTime: never;
    setRepeatOption: never;
    setSelectedWeekDays: never;
    setDescription: never;
    reset: never;
  }
> => ({
  jobName: "",
  wage: 0,
  startDate: new Date(),
  endDate: new Date(),
  startTime: new Date(),
  endTime: new Date(),
  repeatOption: "daily",
  selectedWeekDays: new Set(),
  description: "",
});

export const useShiftStore = create<ShiftStore>((set) => ({
  ...createInitialShiftState(),
  setJobName: (jobName) => set({ jobName }),
  setWage: (wage) => set({ wage }),
  setStartDate: (startDate) => set({ startDate }),
  setEndDate: (endDate) => set({ endDate }),
  setStartTime: (startTime) => set({ startTime }),
  setEndTime: (endTime) => set({ endTime }),
  setRepeatOption: (repeatOption) => set({ repeatOption }),
  setSelectedWeekDays: (selectedWeekDays) => set({ selectedWeekDays }),
  setDescription: (description) => set({ description }),
  reset: () => set(createInitialShiftState()),
}));

// 전체 스케줄 저장 (ID 기반) - 영구 저장 적용
interface ScheduleStore {
  allSchedulesById: SchedulesById;

  addSchedule: (schedule: WorkSession) => void;
  updateSchedule: (id: string, updates: Partial<WorkSession>) => void;
  deleteSchedule: (id: string) => void;
  getScheduleById: (id: string) => WorkSession | undefined;
  getAllSchedules: () => WorkSession[];
  clear: () => void; // 추가
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      allSchedulesById: {},

      addSchedule: (schedule: WorkSession) =>
        set((state: ScheduleStore) => ({
          allSchedulesById: {
            ...state.allSchedulesById,
            [schedule.id]: {
              ...schedule,
              color: schedule.color || getSessionColor(schedule.id),
            },
          },
        })),

      updateSchedule: (id: string, updates: Partial<WorkSession>) =>
        set((state: ScheduleStore) => ({
          allSchedulesById: {
            ...state.allSchedulesById,
            [id]: { ...state.allSchedulesById[id], ...updates },
          },
        })),

      deleteSchedule: (id: string) =>
        set((state: ScheduleStore) => {
          const { [id]: deleted, ...remaining } = state.allSchedulesById;
          return { allSchedulesById: remaining };
        }),
      getScheduleById: (id: string) => get().allSchedulesById[id],
      getAllSchedules: () => Object.values(get().allSchedulesById),
      clear: () => set({ allSchedulesById: {} }), // 추가
    }),
    createPersistConfig(STORE_NAMES.SCHEDULE)
  )
);

// 일별 스케줄 저장 - 영구 저장 적용 "날짜":["세션ID1","세션ID2"]
interface DateScheduleStore {
  dateSchedule: ScheduleByDate;

  addDateSchedule: (schedule: ScheduleByDate) => void;
  updateDateSchedule: (date: string, sessionIds: string[]) => void;
  removeDateSchedule: (date: string) => void;
  clear: () => void; // 추가
}

export const useDateScheduleStore = create<DateScheduleStore>()(
  persist(
    (set) => ({
      dateSchedule: {},

      addDateSchedule: (schedule: ScheduleByDate) =>
        set((state: DateScheduleStore) => ({
          dateSchedule: { ...state.dateSchedule, ...schedule },
        })),
      updateDateSchedule: (date: string, sessionIds: string[]) =>
        set((state: DateScheduleStore) => ({
          dateSchedule: { ...state.dateSchedule, [date]: sessionIds },
        })),
      removeDateSchedule: (date: string) =>
        set((state: DateScheduleStore) => {
          const { [date]: removed, ...remaining } = state.dateSchedule;
          return { dateSchedule: remaining };
        }),
      clear: () => set({ dateSchedule: {} }), // 추가
    }),
    createPersistConfig(STORE_NAMES.DATE_SCHEDULE)
  )
);

// 달력 표시 데이터 스토어
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

      updateCalendarDisplay: (date: string, items: CalendarDisplayItem[]) =>
        set((state: CalendarDisplayStore) => ({
          calendarDisplayMap: { ...state.calendarDisplayMap, [date]: items },
        })),
      clearCalendarDisplay: () => set({ calendarDisplayMap: {} }),
      getCalendarDisplayForDate: (date: string) =>
        get().calendarDisplayMap[date] || [],
    }),
    createPersistConfig(STORE_NAMES.CALENDAR_DISPLAY)
  )
);

// 스케줄 데이터 관리 유틸리티 함수들
export const scheduleStoreUtils = {
  // 모든 스케줄 데이터 초기화
  clearAllScheduleData: () => {
    // MMKV 스토리지에서 삭제
    Object.values(STORE_NAMES).forEach((name) => {
      storage.delete(name);
    });

    // Zustand 스토어 상태도 초기화
    const scheduleStore = useScheduleStore.getState();
    const dateScheduleStore = useDateScheduleStore.getState();
    const calendarDisplayStore = useCalendarDisplayStore.getState();

    scheduleStore.clear();
    dateScheduleStore.clear();
    calendarDisplayStore.clearCalendarDisplay();
  },

  // 저장된 데이터 확인
  getStoredData: () => {
    return Object.fromEntries(
      Object.entries(STORE_NAMES).map(([key, value]) => [
        key,
        storage.getString(value),
      ])
    );
  },

  // 스케줄 데이터 백업 (JSON 형태로)
  exportScheduleData: () => {
    const data = Object.fromEntries(
      Object.entries(STORE_NAMES).map(([key, value]) => [
        key,
        storage.getString(value) ? JSON.parse(storage.getString(value)!) : null,
      ])
    );

    return {
      ...data,
      exportDate: new Date().toISOString(),
    };
  },

  // 스케줄 데이터 복원
  importScheduleData: (data: Record<string, any>) => {
    Object.entries(STORE_NAMES).forEach(([key, value]) => {
      if (data[key]) {
        storage.set(value, JSON.stringify(data[key]));
      }
    });
  },
};
