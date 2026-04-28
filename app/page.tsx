'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/home');
    }, 800);
  };

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-[var(--color-bg-dark)]">
      {/* Immersive Atmosphere */}
      <div className="atmosphere pointer-events-none" />
      <div className="absolute inset-0 animate-aurora pointer-events-none opacity-50 mix-blend-screen" />

      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-dark)]"
          >
            <motion.p 
              initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.2, duration: 1 }}
              className="text-xl font-serif text-[var(--color-primary-text-dark)] tracking-wide"
            >
              Preparing your sanctuary...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 min-h-[80vh]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative text-center space-y-12 max-w-3xl glass-surface p-12 md:p-20 rounded-[40px] shadow-2xl"
        >
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 1.5, ease: "easeOut" }}
              className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight text-[var(--color-primary-text-dark)]"
            >
              Quiet your mind. <br className="hidden md:block"/>
              <span className="italic text-[var(--color-secondary-text-dark)]">Find yourself.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="text-lg md:text-xl text-[var(--color-secondary-text-dark)] max-w-xl mx-auto leading-relaxed"
            >
              A private, empathetic space to express your innermost thoughts. No judgment, just understanding.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <button 
              onClick={handleStart}
              className="px-10 py-5 bg-[var(--color-primary-text-dark)] text-[var(--color-primary-text-light)] rounded-full text-lg tracking-wide hover:scale-105 active:scale-95 transition-all duration-500 shadow-[0_0_40px_rgba(232,226,217,0.2)]"
            >
              Open Your Diary
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto space-y-32">
          {[
            {
              title: "A reflection of you",
              desc: "Write down your passing thoughts, and watch them become stepping stones to deeper self-awareness."
            },
            {
              title: "Always listening",
              desc: "Whether you need to vent, think through a problem, or just share a quiet moment."
            },
            {
              title: "Yours forever",
              desc: "Your words are secured and completely private. A sacred vault for your memories."
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`flex flex-col ${idx % 2 === 1 ? 'md:items-end text-right' : 'md:items-start text-left'}`}
            >
              <h2 className="text-4xl md:text-5xl font-serif text-[var(--color-primary-text-dark)] mb-4">{item.title}</h2>
              <p className="text-xl text-[var(--color-secondary-text-dark)] max-w-md leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 relative z-10 border-t border-white/5 text-center space-y-6">
        <div className="flex items-center justify-center gap-8 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary-text-dark)]">
          <a href="/legal/privacy" className="hover:text-[var(--color-primary-text-dark)] transition-colors duration-300">Privacy</a>
          <a href="/legal/terms" className="hover:text-[var(--color-primary-text-dark)] transition-colors duration-300">Terms</a>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-[#5a5245]">© 2026 WinDear. A sanctuary for the soul.</p>
      </footer>
    </main>
  );
}
