'use client';

import React, { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { MenuContent } from './MenuContent';
import { useUIStore } from '@/lib/store/use-ui-store';

export const GlobalMenuSheet = () => {
  const [mounted, setMounted] = useState(false);
  const { isBottomSheetOpen, setIsBottomSheetOpen } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
