import { create } from 'zustand';

export interface DiaryEntry {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  ai_response?: any;
}

interface DiaryState {
  entries: DiaryEntry[];
  selectedEntry: DiaryEntry | null;
  isLoading: boolean;
  setEntries: (entries: DiaryEntry[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  addEntry: (entry: DiaryEntry) => void;
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => void;
  deleteEntry: (id: string) => void;
  setSelectedEntry: (entry: DiaryEntry | null) => void;
  replaceEntry: (oldId: string, newEntry: DiaryEntry) => void;
}

export const useDiaryStore = create<DiaryState>((set) => ({
  entries: [],
  selectedEntry: null,
  isLoading: false,
  setEntries: (entries) => set({ entries }),
  setIsLoading: (isLoading) => set({ isLoading }),
  addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),
  updateEntry: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  deleteEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),
  setSelectedEntry: (entry) => set({ selectedEntry: entry }),
  replaceEntry: (oldId, newEntry) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === oldId ? newEntry : e)),
    })),
}));

// Custom hook for easier access to entries
export const useEntries = () => useDiaryStore((state) => state.entries);
export const useSelectedEntry = () => useDiaryStore((state) => state.selectedEntry);
