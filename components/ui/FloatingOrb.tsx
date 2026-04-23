'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Feather, Sparkles, MessageSquare, Handshake, Compass, X } from 'lucide-react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { useRouter, usePathname } from 'next/navigation';

export const FloatingOrb = () => {
  const { setActiveView } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Hide orb on absolute landing or specific focused views
  if (pathname === '/') return null;

  const handleAction = (view: 'journal' | 'chat' | 'story', path: string = '/home') => {
    setIsOpen(false);
    if (pathname !== path) {
      router.push(path);
      setTimeout(() => setActiveView(view), 200);
    } else {
      setActiveView(view);
    }
  };

  const actions = [
    { id: 'journal', label: 'Journal', icon: Feather, color: 'bg-amber-500', delay: 0.1 },
    { id: 'chat', label: 'Reflect', icon: MessageSquare, color: 'bg-blue-500', delay: 0.2 },
    { id: 'connect', label: 'Connect', icon: Handshake, color: 'bg-indigo-500', delay: 0.3, path: '/profile' },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-[200] md:bottom-10 md:right-10 flex flex-col items-center gap-4">
      {/* Aura Menu - Pattern 1 (Floating Overlay) */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-center gap-3 mb-2">
            {actions.map((action) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ delay: action.delay }}
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAction(action.id as any, action.path)}
                className="flex items-center gap-3 pr-2 group"
              >
                <div className="bg-white dark:bg-[#1A1A1D] px-3 py-1.5 rounded-full border border-slate-100 dark:border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                   <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{action.label}</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center text-white shadow-lg shadow-${action.color}/20`}>
                  <action.icon className="w-5 h-5" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Orb */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center group"
      >
        {/* Glow Effects */}
        <div className={`absolute inset-0 rounded-full blur-[20px] transition-all duration-500 ${
          isOpen ? 'bg-rose-500 opacity-60 scale-125' : 'bg-indigo-500 opacity-40 animate-pulse'
        }`} />
        
        <div className="absolute inset-0 border border-white/20 rounded-full group-hover:border-white/40 transition-colors" />
        
        {/* Orb Body */}
        <div className={`relative w-full h-full rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 border border-white/10 overflow-hidden ${
          isOpen ? 'bg-neutral-900 rotate-90 scale-90' : 'bg-gradient-to-br from-indigo-600 to-purple-700'
        }`}>
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
                <Compass className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
};
