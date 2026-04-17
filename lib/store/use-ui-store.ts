import { create } from 'zustand';

interface UIState {
  activeView: 'chat' | 'story' | 'journal';
  isInputFocused: boolean;
  selectedJournalContent: string | null;
  setActiveView: (view: 'chat' | 'story' | 'journal') => void;
  setInputFocused: (focused: boolean) => void;
  setSelectedJournalContent: (content: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'chat',
  isInputFocused: false,
  selectedJournalContent: null,
  setActiveView: (view) => set({ activeView: view }),
  setInputFocused: (focused) => set({ isInputFocused: focused }),
  setSelectedJournalContent: (content) => set({ selectedJournalContent: content }),
}));
