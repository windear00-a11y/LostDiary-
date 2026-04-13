import { create } from 'zustand';

import { ChatMessage } from '@/lib/services/chat-service';

interface UIState {
  isBottomSheetOpen: boolean;
  isAIAssistantOpen: boolean;
  showTranslated: boolean;
  language: string;
  pendingMessage: ChatMessage | null;
  setBottomSheetOpen: (isOpen: boolean) => void;
  setAIAssistantOpen: (isOpen: boolean) => void;
  setShowTranslated: (show: boolean) => void;
  setLanguage: (lang: string) => void;
  setPendingMessage: (msg: ChatMessage | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isBottomSheetOpen: false,
  isAIAssistantOpen: false,
  showTranslated: false,
  language: 'en',
  pendingMessage: null,
  setBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
  setAIAssistantOpen: (isOpen) => set({ isAIAssistantOpen: isOpen }),
  setShowTranslated: (show) => set({ showTranslated: show }),
  setLanguage: (lang) => set({ language: lang }),
  setPendingMessage: (msg) => set({ pendingMessage: msg }),
}));
