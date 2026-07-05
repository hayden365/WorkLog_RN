import { create } from "zustand";

interface DateStore {
  year: number;
  month: number;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
  setYearMonth: (year: number, month: number) => void;
}

export const useDateStore = create<DateStore>((set) => ({
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  setMonth: (month) => set({ month }),
  setYear: (year) => set({ year }),
  setYearMonth: (year, month) => set({ year, month }),
}));
