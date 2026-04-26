import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  activeView: 'chat' | 'story' | 'journal' | 'reflect';
  activeLibraryTab: 'feed' | 'echoes';
  activeProfileTab: 'identity' | 'mirror' | 'vault';
  isInputFocused: boolean;
  selectedJournalContent: string | null;
  language: string;
  hasSetLanguage: boolean;
  isDrawerOpen: boolean;
  isBottomSheetOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
  setIsBottomSheetOpen: (isOpen: boolean) => void;
  setActiveView: (view: 'chat' | 'story' | 'journal' | 'reflect') => void;
  setActiveLibraryTab: (tab: 'feed' | 'echoes') => void;
  setActiveProfileTab: (tab: 'identity' | 'mirror' | 'vault') => void;
  setInputFocused: (focused: boolean) => void;
  setSelectedJournalContent: (content: string | null) => void;
  setLanguage: (lang: string) => void;
  setHasSetLanguage: (hasSet: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeView: 'chat',
      activeLibraryTab: 'feed',
      activeProfileTab: 'identity',
      isInputFocused: false,
      selectedJournalContent: null,
      language: 'en',
      hasSetLanguage: false,
      isDrawerOpen: false,
      isBottomSheetOpen: false,
      setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
      setIsBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
      setActiveView: (view) => set({ activeView: view }),
      setActiveLibraryTab: (tab) => set({ activeLibraryTab: tab }),
      setActiveProfileTab: (tab) => set({ activeProfileTab: tab }),
      setInputFocused: (focused) => set({ isInputFocused: focused }),
      setSelectedJournalContent: (content) => set({ selectedJournalContent: content }),
      setLanguage: (lang) => set({ language: lang }),
      setHasSetLanguage: (hasSet) => set({ hasSetLanguage: hasSet }),
    }),
    {
      name: 'windear-ui-storage',
      partialize: (state) => ({
        activeView: state.activeView,
        activeLibraryTab: state.activeLibraryTab,
        language: state.language,
        hasSetLanguage: state.hasSetLanguage,
      }),
    }
  )
);
