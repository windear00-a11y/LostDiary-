'use client';

import React from 'react';
import { BottomSheet } from './BottomSheet';
import { MenuContent } from './MenuContent';
import { useUIStore } from '@/lib/store/use-ui-store';

export const GlobalMenuSheet = () => {
  const { isBottomSheetOpen, setIsBottomSheetOpen } = useUIStore();

  return (
    <BottomSheet 
      isOpen={isBottomSheetOpen} 
      onClose={() => setIsBottomSheetOpen(false)}
      title="Menu"
    >
      <MenuContent onClose={() => setIsBottomSheetOpen(false)} isOpen={isBottomSheetOpen} />
    </BottomSheet>
  );
};
