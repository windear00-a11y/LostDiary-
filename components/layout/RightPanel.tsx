'use client';

import React from 'react';
import { WinDearSoul } from '@/components/ai/WinDearSoul';

export const RightPanel = () => {
  return (
    <div className="hidden xl:flex flex-col w-80 bg-white dark:bg-[#0A0A0A] border-l border-gray-100 dark:border-[#1A1A1A] h-full p-6">
      <WinDearSoul />
    </div>
  );
};
