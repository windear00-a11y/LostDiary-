'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, Send, Link, Zap } from 'lucide-react';

interface SuccessMomentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  type?: 'save' | 'publish' | 'connect';
}

export const SuccessMoment = ({ isOpen, onClose, title, subtitle, type = 'save' }: SuccessMomentProps) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="relative flex flex-col items-center text-center px-6"
          >
            <div className="relative mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  type === 'save' ? 'bg-amber-500/20 text-amber-500' :
                  type === 'publish' ? 'bg-indigo-500/20 text-indigo-500' :
                  'bg-emerald-500/20 text-emerald-500'
                }`}
              >
                {type === 'save' ? <Zap className="w-10 h-10" /> : 
                 type === 'publish' ? <Link className="w-10 h-10" /> : 
                 <Send className="w-10 h-10" />}
              </motion.div>
              
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-2 border-dashed border-current opacity-20 rounded-full"
              />
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-serif italic text-white mb-2"
            >
              {title}
            </motion.h2>
            
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-white/50 font-serif"
              >
                {subtitle}
              </motion.p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
