'use client';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X } from 'lucide-react';
import { authService } from '@/lib/services/auth-service';

export const AuthPromptModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1A1A1D] border border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative"
          >
            <button onClick={onClose} aria-label="Close" className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-2 text-center">Apne dil ki baat mehfuz rakhein</h3>
            <p className="text-sm text-gray-400 mb-8 text-center leading-relaxed">
              Apni thoughts ko hamesha ke liye protect karne ke liye, chaliye ek chhota sa private vault (account) banate hain.
            </p>
            <button 
              onClick={() => authService.signInWithGoogle()}
              className="w-full py-4 bg-white text-black hover:bg-white/90 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
            >
              Google se Login karein
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
