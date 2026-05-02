'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[var(--color-bg-dark)] text-white">
      <h2 className="text-2xl font-serif mb-4 italic">Something went silent...</h2>
      <div className="mb-8 max-w-lg mx-auto">
        <p className="text-sm text-slate-500 mb-4 italic">Don&apos;t worry, even sanctuaries have quiet moments. Let&apos;s try to restore the connection.</p>
        <div className="bg-white/5 p-4 rounded-xl text-left font-mono text-[10px] text-rose-400 overflow-auto max-h-40 border border-white/5">
          <p className="font-bold mb-1">Error Details:</p>
          <p>{error?.message || 'Unknown error'}</p>
          {error?.digest && <p className="opacity-50 mt-1">Digest: {error.digest}</p>}
        </div>
      </div>
      <button 
        onClick={() => reset()} 
        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95"
      >
        Restore Sanctuary
      </button>
    </div>
  );
}
