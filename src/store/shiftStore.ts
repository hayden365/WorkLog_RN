import { create } from "zustand";
import { RepeatOption } from "../models/WorkSession";

interface ShiftStore {
  repeat: RepeatOption;
  setRepeat: (repeat: RepeatOption) => void;
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
  selectedWeekDays: Set<number>;
  setSelectedWeekDays: (weekDays: Set<number>) => void;
  description: string;
  setDescription: (description: string) => void;
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
  repeat: "none",
  setRepeat: (repeat) => set({ repeat }),
  selectedWeekDays: new Set(),
  setSelectedWeekDays: (selectedWeekDays) => set({ selectedWeekDays }),
  description: "",
  setDescription: (description) => set({ description }),
}));
