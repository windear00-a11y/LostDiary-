'use client';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { authService } from '@/lib/services/auth-service';
import { coreService } from '@/lib/services/core-service';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RestoreAccountPage() {
  const [isRestoring, setIsRestoring] = useState(false);
  const router = useRouter();

  const handleRestore = async () => {
    setIsRestoring(true);
    const user = await authService.getUser();
    if (user) {
      await coreService.restoreAccount(user.id);
      router.push('/home');
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-white">Welcome Home</h1>
        <p className="text-gray-400 leading-relaxed">
          Humne aapki sanctuary ka intezaar kiya. Aapka panna abhi bhi mehfooz hai.
        </p>
        <button 
          onClick={handleRestore}
          disabled={isRestoring}
          className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          {isRestoring ? 'Restoring...' : 'Restore My Sanctuary'}
          {!isRestoring && <ArrowRight className="w-4 h-4" />}
        </button>
      </motion.div>
    </main>
  );
}
