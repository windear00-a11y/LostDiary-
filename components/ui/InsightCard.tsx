'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InsightCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  unit?: string;
  description: string;
  colorClass: string;
  indicatorColor?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  icon: Icon,
  title,
  value,
  unit,
  description,
  colorClass,
  indicatorColor,
}) => {
  return (
    <div className="p-5 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] space-y-3">
      <div className={`flex items-center gap-2 ${colorClass}`}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-gray-900 dark:text-gray-100">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
        {indicatorColor && (
          <div className={`h-2 w-2 rounded-full ${indicatorColor} ml-1`} />
        )}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
