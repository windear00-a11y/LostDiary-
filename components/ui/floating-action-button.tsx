'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Mic, Zap, PenLine } from 'lucide-react';

export const FloatingActionButton = ({ onNewEntry }: { onNewEntry?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: <PenLine className="w-5 h-5" />, label: 'New Entry', color: 'bg-indigo-500', onClick: onNewEntry },
    { icon: <Mic className="w-5 h-5" />, label: 'Voice Note', color: 'bg-purple-500' },
    { icon: <Zap className="w-5 h-5" />, label: 'Quick Thought', color: 'bg-amber-500' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-3"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
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
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] rounded-full shadow-xl hover:shadow-2xl transition-all"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </div>
  );
};
