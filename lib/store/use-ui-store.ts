import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  activeView: 'chat' | 'story' | 'journal' | 'reflect';
  isInputFocused: boolean;
  selectedJournalContent: string | null;
  language: string;
  hasSetLanguage: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
  setActiveView: (view: 'chat' | 'story' | 'journal' | 'reflect') => void;
  setInputFocused: (focused: boolean) => void;
  setSelectedJournalContent: (content: string | null) => void;
  setLanguage: (lang: string) => void;
  setHasSetLanguage: (hasSet: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeView: 'chat',
      isInputFocused: false,
      selectedJournalContent: null,
      language: 'en',
      hasSetLanguage: false,
      isDrawerOpen: false,
      setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
      setActiveView: (view) => set({ activeView: view }),
      setInputFocused: (focused) => set({ isInputFocused: focused }),
      setSelectedJournalContent: (content) => set({ selectedJournalContent: content }),
      setLanguage: (lang) => set({ language: lang }),
      setHasSetLanguage: (hasSet) => set({ hasSetLanguage: hasSet }),
    }),
    {
      name: 'windear-ui-storage',
      partialize: (state) => ({
        activeView: state.activeView,
        language: state.language,
        hasSetLanguage: state.hasSetLanguage,
      }),
    }
  )
);
