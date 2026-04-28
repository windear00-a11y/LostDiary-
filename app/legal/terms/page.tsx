'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft, Scale, MessageSquare, Handshake, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsOfUsePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[var(--color-bg-dark)] text-slate-300 font-sans selection:bg-amber-500/20 px-6 py-20">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-6">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 text-slate-500 hover:text-white transition-colors flex items-center gap-2 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-widest font-bold">Back</span>
          </button>
          
          <div className="flex items-center gap-4">
             <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <Scale className="w-6 h-6 text-amber-500" />
             </div>
             <div>
                <h1 className="text-4xl font-serif font-bold text-white">Terms of Use</h1>
                <p className="text-sm text-slate-500 mt-1 italic">Last updated: April 22, 2026</p>
             </div>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert prose-slate max-w-none space-y-8 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Shield className="w-5 h-5 text-amber-400" />
              1. The WinDear Covenant
            </h2>
            <p>
              By entering WinDear, you agree to treat this space as a sanctuary. This is a platform for vulnerability, reflection, and artistic storytelling. Use of the service implies your agreement to these terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              2. User Content &amp; Ethics
            </h2>
            <p>
              You are responsible for all content you record or publish. WinDear is a zero-moderation space for your private vault, but we prohibit the following in any public spaces (Bridges, Library):
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm italic">
              <li>Harassment or predatory behavior towards other users.</li>
              <li>Publishing explicit personal identifiers that bypass our Neural Wash.</li>
              <li>Using the platform for illegal activities.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Handshake className="w-5 h-5 text-amber-400" />
              3. Bridges &amp; Connections
            </h2>
            <p>
              Bridges are fragile. We do not guarantee the permanence of any connection. A bridge can be dissolved (broken) by either party or by the system if &quot;Resonance&quot; is lost. Once broken, the connection is immutable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Scale className="w-5 h-5 text-amber-400" />
              4. Service Limitations
            </h2>
            <p>
              WinDear is an AI-powered experience. The insights provided by our &quot;Mirror&quot; are for self-reflection and artistic value only. We are not a medical or psychological counseling service. If you are in crisis, please seek professional assistance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              5. Disclaimer
            </h2>
            <p>
              We provide WinDear &quot;as is&quot; and without warranties. While we take extreme technical measures to protect your privacy (Row Level Security), you use the service at your own risk.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="pt-20 border-t border-white/5 pb-10 text-center text-slate-600 text-xs">
          <p>© 2026 WinDear. Treat every soul with care.</p>
        </footer>
      </div>

      {/* Decorative Glow */}
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
    </main>
  );
}
