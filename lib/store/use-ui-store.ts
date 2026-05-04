import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  activeView: 'chat' | 'timeline';
  activeProfileTab: 'identity' | 'mirror' | 'vault';
  isInputFocused: boolean;
  language: string;
  hasSetLanguage: boolean;
  isBottomSheetOpen: boolean;
  isHistoryOpen: boolean;
  chatPersonaMode: 'mirror' | 'guide';
  isBrutalHonestyOn: boolean;
  memorySyncTrigger: number;
  setIsBottomSheetOpen: (isOpen: boolean) => void;
  setIsHistoryOpen: (isOpen: boolean) => void;
  setActiveView: (view: 'chat' | 'timeline') => void;
  setActiveProfileTab: (tab: 'identity' | 'mirror' | 'vault') => void;
  setInputFocused: (focused: boolean) => void;
  setLanguage: (lang: string) => void;
  setHasSetLanguage: (hasSet: boolean) => void;
  setChatPersonaMode: (mode: 'mirror' | 'guide') => void;
  setIsBrutalHonestyOn: (isOn: boolean) => void;
  triggerMemorySync: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeView: 'chat',
      activeProfileTab: 'identity',
      isInputFocused: false,
      language: 'en',
      hasSetLanguage: false,
      isBottomSheetOpen: false,
      isHistoryOpen: false,
      chatPersonaMode: 'mirror',
      isBrutalHonestyOn: false,
      memorySyncTrigger: 0,
      setIsBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
      setIsHistoryOpen: (isOpen) => set({ isHistoryOpen: isOpen }),
      setActiveView: (view) => set({ activeView: view }),
      setActiveProfileTab: (tab) => set({ activeProfileTab: tab }),
      setInputFocused: (focused) => set({ isInputFocused: focused }),
      setLanguage: (lang) => set({ language: lang }),
      setHasSetLanguage: (hasSet) => set({ hasSetLanguage: hasSet }),
      setChatPersonaMode: (mode) => set({ chatPersonaMode: mode }),
      setIsBrutalHonestyOn: (isOn) => set({ isBrutalHonestyOn: isOn }),
      triggerMemorySync: () => set((state) => ({ memorySyncTrigger: state.memorySyncTrigger + 1 })),
    }),
    {
      name: 'windear-ui-storage',
      partialize: (state) => ({
        activeView: state.activeView,
        language: state.language,
        hasSetLanguage: state.hasSetLanguage,
        chatPersonaMode: state.chatPersonaMode,
        isBrutalHonestyOn: state.isBrutalHonestyOn,
      }),
    }
  )
);
