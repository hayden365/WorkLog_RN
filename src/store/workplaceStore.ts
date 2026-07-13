import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import { Workplace } from "../models/Workplace";

export const WORKPLACE_STORE_NAME = "workplace-store";

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

interface WorkplaceStore {
  workplacesById: Record<string, Workplace>;
  addWorkplace: (workplace: Workplace) => void;
  updateWorkplace: (id: string, updates: Partial<Workplace>) => void;
  archiveWorkplace: (id: string) => void;
  getWorkplaceById: (id: string) => Workplace | undefined;
  getAllWorkplaces: () => Workplace[];
  getActiveWorkplaces: () => Workplace[];
}

export const useWorkplaceStore = create<WorkplaceStore>()(
  persist(
    (set, get) => ({
      workplacesById: {},
      addWorkplace: (workplace) =>
        set((state) => ({
          workplacesById: { ...state.workplacesById, [workplace.id]: workplace },
        })),
      updateWorkplace: (id, updates) =>
        set((state) => ({
          workplacesById: {
            ...state.workplacesById,
            [id]: { ...state.workplacesById[id], ...updates },
          },
        })),
      archiveWorkplace: (id) =>
        set((state) => ({
          workplacesById: {
            ...state.workplacesById,
            [id]: { ...state.workplacesById[id], archived: true },
          },
        })),
      getWorkplaceById: (id) => get().workplacesById[id],
      getAllWorkplaces: () => Object.values(get().workplacesById),
      getActiveWorkplaces: () =>
        Object.values(get().workplacesById).filter((w) => !w.archived),
    }),
    { name: WORKPLACE_STORE_NAME, storage: mmkvStorage, version: 1 }
  )
);
