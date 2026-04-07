import { create } from 'zustand';

interface UIState {
  isBottomSheetOpen: boolean;
  isAIAssistantOpen: boolean;
  isInsightsOpen: boolean;
  showTranslated: boolean;
  setBottomSheetOpen: (isOpen: boolean) => void;
  setAIAssistantOpen: (isOpen: boolean) => void;
  setInsightsOpen: (isOpen: boolean) => void;
  setShowTranslated: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isBottomSheetOpen: false,
  isAIAssistantOpen: false,
  isInsightsOpen: false,
  showTranslated: false,
  setBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
  setAIAssistantOpen: (isOpen) => set({ isAIAssistantOpen: isOpen }),
  setInsightsOpen: (isOpen) => set({ isInsightsOpen: isOpen }),
  setShowTranslated: (show) => set({ showTranslated: show }),
}));
