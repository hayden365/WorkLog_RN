import { create } from "zustand";
import {
  RepeatOption,
  ScheduleByDate,
  WorkSession,
} from "../models/WorkSession";

interface ShiftStore {
  jobName: string;
  setJobName: (jobName: string) => void;
  wage: number | null;
  setWage: (wage: number | null) => void;
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
  wage: null,
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
      wage: null,
      startDate: new Date(),
      endDate: new Date(),
      startTime: new Date(),
      endTime: new Date(),
      repeatOption: "daily",
      selectedWeekDays: new Set(),
      description: "",
    }),
}));

// 전체 스케줄 저장
interface ScheduleStore {
  schedule: WorkSession[];
  addSchedule: (schedule: WorkSession) => void;
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  schedule: [],
  addSchedule: (schedule) =>
    set((state) => ({
      schedule: [...state.schedule, schedule],
    })),
}));

// 일별 스케줄 저장
interface DateScheduleStore {
  dateSchedule: ScheduleByDate;
  addDateSchedule: (schedule: ScheduleByDate) => void;
}

export const useDateScheduleStore = create<DateScheduleStore>((set) => ({
  dateSchedule: {},
  addDateSchedule: (schedule) =>
    set((state) => ({
      dateSchedule: schedule,
    })),
}));
