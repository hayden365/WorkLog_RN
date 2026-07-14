import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const mmkvStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: unknown) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
}));

// 근무시간 표시 모드: 실근무(휴게 제외) 또는 총근무(휴게 포함).
// 급여 계산에는 영향 없음 — 급여는 항상 실근무 기준으로 고정.
export type WorkTimeDisplayMode = 'actual' | 'total';

interface SettingsStore {
  workTimeDisplayMode: WorkTimeDisplayMode;
  setWorkTimeDisplayMode: (mode: WorkTimeDisplayMode) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      workTimeDisplayMode: 'actual',
      setWorkTimeDisplayMode: (workTimeDisplayMode) => set({ workTimeDisplayMode }),
    }),
    {
      name: 'settings-store',
      storage: mmkvStorage,
      version: 1,
    },
  ),
);
