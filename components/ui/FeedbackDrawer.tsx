'use client';
import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const FeedbackDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'feedback' | 'bug' | 'feature_request'>('feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/telemetry/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description: message,
          metadata: {
            url: window.location.href,
            userAgent: navigator.userAgent
          }
        })
      });
      
      if (!res.ok) throw new Error("Failed to send");
      
      toast.success("Thank you. Your voice has been heard.");
      setMessage('');
      setIsOpen(false);
    } catch (e) {
      toast.error("Failed to send, but we still appreciate you.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="Give feedback"
        className="fixed bottom-6 right-6 p-4 bg-[var(--color-bg-dark)] border border-white/10 text-white/70 hover:text-white rounded-full shadow-2xl z-50 hover:scale-105 transition-all glass-surface"
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
              <p className="text-sm text-gray-400 mb-4">What would make your experience more profound, or did something feel misaligned?</p>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setCategory('feedback')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${category === 'feedback' ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-gray-400'}`}
                >Feedback</button>
                <button
                  onClick={() => setCategory('bug')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all focus:outline-none ${category === 'bug' ? 'bg-rose-500/20 text-rose-500' : 'bg-white/5 text-gray-400'}`}
                >Report Bug</button>
              </div>

              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={category === 'bug' ? "What went wrong?" : "Share your raw thoughts..."}
                className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl mb-6 text-sm outline-none focus:border-amber-500 text-white placeholder:text-gray-600 resize-none"
                rows={4}
                aria-label="Feedback message"
              />
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim()}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-black rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Sending..." : "Send to WinDear"} <Send className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
