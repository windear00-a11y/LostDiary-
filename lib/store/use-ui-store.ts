import { create } from 'zustand';

interface UIState {
  activeView: 'chat' | 'story';
  isInputFocused: boolean;
  setActiveView: (view: 'chat' | 'story') => void;
  setInputFocused: (focused: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'chat',
  isInputFocused: false,
  setActiveView: (view) => set({ activeView: view }),
  setInputFocused: (focused) => set({ isInputFocused: focused }),
}));
