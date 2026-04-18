import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  activeView: 'chat' | 'story' | 'journal';
  isInputFocused: boolean;
  selectedJournalContent: string | null;
  language: string;
  setActiveView: (view: 'chat' | 'story' | 'journal') => void;
  setInputFocused: (focused: boolean) => void;
  setSelectedJournalContent: (content: string | null) => void;
  setLanguage: (lang: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeView: 'chat',
      isInputFocused: false,
      selectedJournalContent: null,
      language: 'en',
      setActiveView: (view) => set({ activeView: view }),
      setInputFocused: (focused) => set({ isInputFocused: focused }),
      setSelectedJournalContent: (content) => set({ selectedJournalContent: content }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'windear-ui-storage',
    }
  )
);
