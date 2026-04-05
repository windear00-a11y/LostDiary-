import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  isBottomSheetOpen: boolean;
  isAIAssistantOpen: boolean;
  showTranslated: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setBottomSheetOpen: (isOpen: boolean) => void;
  setAIAssistantOpen: (isOpen: boolean) => void;
  setShowTranslated: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isBottomSheetOpen: false,
  isAIAssistantOpen: false,
  showTranslated: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
  setAIAssistantOpen: (isOpen) => set({ isAIAssistantOpen: isOpen }),
  setShowTranslated: (show) => set({ showTranslated: show }),
}));
