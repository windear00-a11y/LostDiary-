'use client';

import { Book, Sparkles, PenLine, Heart, ArrowRight, Sun, CloudRain, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useSky } from '@/lib/sky-context';

export default function LandingPage() {
  const { user } = useAuth();
  const { mode, setMode } = useSky();
  const router = useRouter();

  const handleCTA = () => {
    if (user) {
      router.push('/home');
    } else {
      router.push('/auth');
    }
  };

  return (
    <main className="min-h-screen bg-transparent text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight leading-[1.1] text-white">
              WinDear turns <br />
              <span className="italic text-indigo-600 dark:text-indigo-400">your life into your story.</span>
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-serif italic">
              A companion that listens, reflects, and helps you find the beauty in your journey.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex justify-center"
          >
            <button 
              onClick={handleCTA}
              className="group relative px-8 py-4 bg-[#111827] dark:bg-[#fdfcfb] text-white dark:text-[#111827] rounded-full text-lg font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Start your story
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Demo Preview Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-10 md:p-16 bg-white dark:bg-[#161616] rounded-[40px] border border-gray-100 dark:border-gray-800/50 shadow-2xl shadow-indigo-100/20 dark:shadow-none"
          >
            <div className="absolute top-8 left-8">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-6 font-serif italic text-xl md:text-2xl leading-relaxed text-gray-800 dark:text-gray-200">
              <p>
                &ldquo;Today, the rain felt different. It wasn&apos;t just water falling from the sky; it was a quiet invitation to slow down. I noticed how the coffee steam curled against the window, a small dance in a busy world...&rdquo;
              </p>
              <div className="pt-6 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest font-bold text-indigo-500">WinDear Narrative</span>
                <span className="text-xs text-gray-400">Chapter 1: The Quiet Morning</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 px-6 bg-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-16">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white dark:bg-[#161616] rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800/50">
                <PenLine className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-white">1. Write</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Share your thoughts, photos, or voice. Just honest moments from your life.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white dark:bg-[#161616] rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800/50">
                <Sparkles className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-white">2. Reflect</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                WinDear listens, finding the patterns and beauty unique to your journey.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white dark:bg-[#161616] rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800/50">
                <Heart className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-white">3. Grow</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Watch your story evolve into a beautiful narrative of your personal growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emotional Hook Section */}
      <section className="py-48 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-serif italic leading-tight text-slate-100">
              &ldquo;Your life is already a masterpiece. <br />
              We just help you read it.&rdquo;
            </h2>
            <div className="w-12 h-px bg-indigo-200 dark:bg-indigo-900 mx-auto" />
          </motion.div>
          
          <button 
            onClick={handleCTA}
            className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs hover:tracking-[0.3em] transition-all"
          >
            Begin your journey &rarr;
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100 dark:border-gray-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Book className="w-4 h-4 text-indigo-500" />
          <span className="font-serif italic text-sm">WinDear</span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400">
          &copy; {new Date().getFullYear()} WinDear. Your story is safe.
        </p>
      </footer>

      {/* Mood Switcher (Subtle) */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
        <button
          onClick={() => setMode('calm')}
          className={`p-3 rounded-full transition-all ${mode === 'calm' ? 'bg-indigo-500 text-white shadow-lg scale-110' : 'bg-white/80 dark:bg-black/80 text-gray-400 hover:text-indigo-500'}`}
          title="Calm Mode"
        >
          <Sun className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMode('sad')}
          className={`p-3 rounded-full transition-all ${mode === 'sad' ? 'bg-indigo-500 text-white shadow-lg scale-110' : 'bg-white/80 dark:bg-black/80 text-gray-400 hover:text-indigo-500'}`}
          title="Sad Mode"
        >
          <CloudRain className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMode('energetic')}
          className={`p-3 rounded-full transition-all ${mode === 'energetic' ? 'bg-indigo-500 text-white shadow-lg scale-110' : 'bg-white/80 dark:bg-black/80 text-gray-400 hover:text-indigo-500'}`}
          title="Energetic Mode"
        >
          <Zap className="w-5 h-5" />
        </button>
      </div>
    </main>
  );
}
