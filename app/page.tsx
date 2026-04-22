'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = () => {
    setIsTransitioning(true);
    router.push('/home');
  };

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white flex flex-col relative">
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0d]"
          >
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-serif italic text-slate-400"
            >
              Preparing your space...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] z-0" />
        
        {/* Animated Glow */}
        <motion.div 
          className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] z-0" 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} 
        />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center space-y-8 max-w-2xl"
        >
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight">
            Some stories are too personal to tell the world.
          </h1>
          <p className="text-xl text-slate-400 font-serif italic">
            Write them here. I&apos;ll understand.
          </p>
          <button 
            onClick={handleStart}
            className="px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Writing
          </button>
        </motion.div>
      </section>

      {/* Scroll Sections */}
      <section className="py-32 px-6 space-y-32 max-w-3xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-4xl font-serif font-bold">I&apos;m here to listen. Always.</h2>
          <p className="text-lg text-slate-400">I&apos;ll listen to your thoughts and help you turn them into something meaningful.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-4xl font-serif font-bold">Your thoughts become memories</h2>
          <div className="flex items-center justify-center gap-4 text-slate-500">
            <span>Reflect</span>
            <span>→</span>
            <span>Write</span>
            <span>→</span>
            <span>Remember</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-4xl font-serif font-bold">Private. Personal. Yours.</h2>
          <p className="text-lg text-slate-400">Your stories are yours alone. Safe and private.</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          <a href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="/legal/terms" className="hover:text-white transition-colors">Terms of Use</a>
        </div>
        <p className="text-slate-600 text-[10px] uppercase tracking-widest">© 2026 WinDear. All rights reserved.</p>
      </footer>
    </main>
  );
}
