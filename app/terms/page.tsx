'use client';

import { ArrowLeft, FileText, UserPlus, AlertCircle, Scale, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#F9FAFB] selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-20 space-y-12">
        {/* Header */}
        <div className="space-y-6">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Terms of Service</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            Simple rules for a better experience at WinDear.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <UserPlus className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-xs">Using WinDear</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              By using WinDear, you agree to these terms. WinDear is a personal diary app powered by AI. You are responsible for the content you write and for keeping your account information secure.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-xs">Your Content</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              You own everything you write. We don&apos;t claim ownership over your diary entries. We only process them to provide you with the AI-driven insights and features that make WinDear unique.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-xs">AI Disclaimer</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              WinDear uses AI to provide insights and responses. While we strive for empathy and accuracy, AI can sometimes make mistakes or provide unexpected responses. WinDear is not a substitute for professional mental health advice or therapy.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <Scale className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-xs">Acceptable Use</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Please use WinDear for its intended purpose: personal reflection and growth. Do not use the app to store illegal content or to attempt to harm the service or other users.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-xs">Changes to Terms</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We may update these terms as WinDear evolves. We&apos;ll notify you of any major changes. Continued use of the app means you accept the updated terms.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-12 border-t border-gray-100 dark:border-[#1A1A1A] text-center">
          <p className="text-sm text-gray-400">Last updated: April 2, 2026</p>
          <p className="mt-2 text-sm text-gray-400">By using WinDear, you agree to these simple terms.</p>
        </div>
      </div>
    </div>
  );
}
