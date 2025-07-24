import { create } from "zustand";

interface ShiftStore {
  startDate: Date;
  setStartDate: (date: Date) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
  repeat: string;
  setRepeat: (repeat: string) => void;
}

export const useShiftStore = create<ShiftStore>((set) => ({
  startDate: new Date(),
  setStartDate: (startDate) => set({ startDate }),
  endDate: new Date(),
  setEndDate: (endDate) => set({ endDate }),
  repeat: "none",
  setRepeat: (repeat) => set({ repeat }),
}));
