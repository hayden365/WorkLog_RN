import { create } from "zustand";

interface DateStore {
  month: number;
  setMonth: (month: number) => void;
}

export const useDateStore = create<DateStore>((set) => ({
  month: new Date().getMonth(),
  setMonth: (month) => set({ month }),
}));
