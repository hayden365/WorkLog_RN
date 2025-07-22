import { create } from "zustand";

interface DateStore {
  month: string;
  setMonth: (month: string) => void;
}

export const useDateStore = create<DateStore>((set) => ({
  month: new Date().toLocaleString("ko-KR", { month: "long" }),
  setMonth: (month) => set({ month }),
}));
