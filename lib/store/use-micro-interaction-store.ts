import { create } from 'zustand';

interface MicroInteractionStore {
  message: string | null;
  setMessage: (message: string | null) => void;
}

export const useMicroInteractionStore = create<MicroInteractionStore>((set) => ({
  message: null,
  setMessage: (message) => set({ message }),
}));
