'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SkyMode } from '@/components/ui/StarryBackground';

interface SkyContextType {
  mode: SkyMode;
  setMode: (mode: SkyMode) => void;
}

const SkyContext = createContext<SkyContextType | undefined>(undefined);

export function SkyProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SkyMode>('calm');

  return (
    <SkyContext.Provider value={{ mode, setMode }}>
      {children}
    </SkyContext.Provider>
  );
}

export function useSky() {
  const context = useContext(SkyContext);
  if (context === undefined) {
    throw new Error('useSky must be used within a SkyProvider');
  }
  return context;
}
