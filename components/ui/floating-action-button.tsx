'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Mic, Zap, PenLine } from 'lucide-react';

import { useUIStore } from '@/lib/store/use-ui-store';
import { useDiaryStore } from '@/lib/store/use-diary-store';

export const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setBottomSheetOpen } = useUIStore();
  const { setSelectedEntry } = useDiaryStore();

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setBottomSheetOpen(true);
  };

  const actions = [
    { icon: <PenLine className="w-5 h-5" />, label: 'New Entry', color: 'bg-indigo-500', onClick: handleNewEntry },
    { icon: <Mic className="w-5 h-5" />, label: 'Voice Note', color: 'bg-purple-500' },
    { icon: <Zap className="w-5 h-5" />, label: 'Quick Thought', color: 'bg-amber-500' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                  staggerDirection: -1
                }
              }
            }}
            className="flex flex-col gap-3"
          >
            {actions.map((action) => (
              <motion.button
                key={action.label}
                variants={{
                  hidden: { opacity: 0, x: 20, scale: 0.8 },
                  visible: { opacity: 1, x: 0, scale: 1 }
                }}
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (action.onClick) action.onClick();
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-lg ${action.color} hover:opacity-90 transition-opacity`}
              >
                <span className="text-sm font-medium">{action.label}</span>
                {action.icon}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9, rotate: -5 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] rounded-full shadow-xl hover:shadow-2xl transition-shadow"
      >
        <motion.div 
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </div>
  );
};
