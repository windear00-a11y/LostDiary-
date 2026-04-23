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
            className="bg-[#1A1A1D] border border-red-500/20 rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative"
          >
            <button onClick={onClose} aria-label="Close" className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-2 text-center">Delete Sanctuary?</h3>
            <p className="text-sm text-gray-400 mb-8 text-center leading-relaxed">
              This will pause all your data and schedule it for permanent deletion. Once confirmed, you will be signed out and your sanctuary will begin its closing ritual.
            </p>
            <button 
              onClick={onDelete}
              className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all text-white"
            >
              Confirm Deletion Schedule
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
