'use client';
import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FeedbackDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="Give feedback"
        className="fixed bottom-6 right-6 p-4 bg-amber-500 text-white rounded-full shadow-2xl z-50 hover:scale-110 transition-transform"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A1D] border border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button onClick={() => setIsOpen(false)} aria-label="Close feedback" className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-xl font-serif font-bold text-white mb-2">Help Us Evolve</h3>
              <p className="text-sm text-gray-400 mb-6">What would make your experience more profound, or did something feel misaligned?</p>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your raw thoughts..."
                className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl mb-6 text-sm outline-none focus:border-amber-500"
                rows={4}
                aria-label="Feedback message"
              />
              <button 
                onClick={() => { setMessage(''); setIsOpen(false); }}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                Send to WinDear
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
