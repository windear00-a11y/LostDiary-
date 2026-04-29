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
  isHistoryOpen: boolean;
  chatPersonaMode: 'mirror' | 'guide';
  isBrutalHonestyOn: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
  setIsBottomSheetOpen: (isOpen: boolean) => void;
  setIsHistoryOpen: (isOpen: boolean) => void;
  setActiveView: (view: 'chat' | 'story' | 'journal' | 'reflect') => void;
  setActiveLibraryTab: (tab: 'feed' | 'echoes') => void;
  setActiveProfileTab: (tab: 'identity' | 'mirror' | 'vault') => void;
  setInputFocused: (focused: boolean) => void;
  setSelectedJournalContent: (content: string | null) => void;
  setLanguage: (lang: string) => void;
  setHasSetLanguage: (hasSet: boolean) => void;
  setChatPersonaMode: (mode: 'mirror' | 'guide') => void;
  setIsBrutalHonestyOn: (isOn: boolean) => void;
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
      isHistoryOpen: false,
      chatPersonaMode: 'mirror',
      isBrutalHonestyOn: false,
      setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
      setIsBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
      setIsHistoryOpen: (isOpen) => set({ isHistoryOpen: isOpen }),
      setActiveView: (view) => set({ activeView: view }),
      setActiveLibraryTab: (tab) => set({ activeLibraryTab: tab }),
      setActiveProfileTab: (tab) => set({ activeProfileTab: tab }),
      setInputFocused: (focused) => set({ isInputFocused: focused }),
      setSelectedJournalContent: (content) => set({ selectedJournalContent: content }),
      setLanguage: (lang) => set({ language: lang }),
      setHasSetLanguage: (hasSet) => set({ hasSetLanguage: hasSet }),
      setChatPersonaMode: (mode) => set({ chatPersonaMode: mode }),
      setIsBrutalHonestyOn: (isOn) => set({ isBrutalHonestyOn: isOn }),
    }),
    {
      name: 'windear-ui-storage',
      partialize: (state) => ({
        activeView: state.activeView,
        activeLibraryTab: state.activeLibraryTab,
        language: state.language,
        hasSetLanguage: state.hasSetLanguage,
        chatPersonaMode: state.chatPersonaMode,
        isBrutalHonestyOn: state.isBrutalHonestyOn,
      }),
    }
  )
);
