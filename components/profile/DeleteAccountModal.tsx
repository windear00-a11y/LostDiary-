'use client';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export const DeleteAccountModal = ({ isOpen, onClose, onDelete }: { isOpen: boolean; onClose: () => void; onDelete: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#0a0a0a] border border-rose-500/20 rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative"
          >
            <button onClick={onClose} aria-label="Close" className="absolute top-6 right-6 p-2 text-white/30 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-serif text-white mb-2 text-center">Permadelete</h3>
            <p className="text-[13px] text-white/60 mb-8 text-center leading-relaxed">
              This will pause all your data and schedule it for permanent deletion. Once confirmed, you will be signed out and your sanctuary will begin its closing ritual.
            </p>
            <button 
              onClick={onDelete}
              className="w-full py-5 bg-rose-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-rose-600"
            >
              Confirm Permadeletion
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
