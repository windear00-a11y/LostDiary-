import { create } from 'zustand';

interface DiaryEntry {
  id: string;
  user_id: string;
  content: string;
  translated_content?: string;
  summary?: string;
  mood?: string;
  insight?: string;
  suggestion?: string;
  tags?: string[];
  image_url?: string;
  is_pinned?: boolean;
  created_at: string;
}

interface DiaryState {
  entries: DiaryEntry[];
  selectedEntry: DiaryEntry | null;
  setEntries: (entries: DiaryEntry[]) => void;
  addEntry: (entry: DiaryEntry) => void;
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => void;
  deleteEntry: (id: string) => void;
  togglePin: (id: string) => void;
  setSelectedEntry: (entry: DiaryEntry | null) => void;
  replaceEntry: (oldId: string, newEntry: DiaryEntry) => void;
}

export const useDiaryStore = create<DiaryState>((set) => ({
  entries: [],
  selectedEntry: null,
  setEntries: (entries) => set({ entries }),
  addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),
  updateEntry: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  deleteEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),
  togglePin: (id) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, is_pinned: !e.is_pinned } : e
      ),
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
