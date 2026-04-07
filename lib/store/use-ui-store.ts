import { create } from 'zustand';

interface UIState {
  isBottomSheetOpen: boolean;
  isAIAssistantOpen: boolean;
  showTranslated: boolean;
  setBottomSheetOpen: (isOpen: boolean) => void;
  setAIAssistantOpen: (isOpen: boolean) => void;
  setShowTranslated: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isBottomSheetOpen: false,
  isAIAssistantOpen: false,
  showTranslated: false,
  setBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
  setAIAssistantOpen: (isOpen) => set({ isAIAssistantOpen: isOpen }),
  setShowTranslated: (show) => set({ showTranslated: show }),
}));
