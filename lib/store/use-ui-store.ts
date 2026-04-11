import { create } from 'zustand';

interface UIState {
  isBottomSheetOpen: boolean;
  isAIAssistantOpen: boolean;
  showTranslated: boolean;
  language: string;
  setBottomSheetOpen: (isOpen: boolean) => void;
  setAIAssistantOpen: (isOpen: boolean) => void;
  setShowTranslated: (show: boolean) => void;
  setLanguage: (lang: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isBottomSheetOpen: false,
  isAIAssistantOpen: false,
  showTranslated: false,
  language: 'en',
  setBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
  setAIAssistantOpen: (isOpen) => set({ isAIAssistantOpen: isOpen }),
  setShowTranslated: (show) => set({ showTranslated: show }),
  setLanguage: (lang) => set({ language: lang }),
}));
