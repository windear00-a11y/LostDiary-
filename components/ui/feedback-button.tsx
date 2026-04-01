'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { FeedbackModal } from './feedback-modal';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] px-4 py-3 rounded-full shadow-lg hover:bg-[#1f2937] dark:hover:bg-white transition-all active:scale-95"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-medium">{t('feedback.button')}</span>
      </button>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
