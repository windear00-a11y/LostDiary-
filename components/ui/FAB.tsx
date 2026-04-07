'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  label?: string;
}

export const FAB: React.FC<FABProps> = ({ onClick, label = "New Entry" }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90 z-50 group"
      aria-label={label}
    >
      <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
    </button>
  );
};
