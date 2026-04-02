'use client';

import { ArrowLeft, Shield, Lock, EyeOff, Database, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';

export default function PrivacyPage() {
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
          <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Privacy Policy</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            Your thoughts are sacred. Here is how we protect them at WinDear.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-xs">Our Core Promise</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              WinDear is built on trust. We believe your diary should be the safest place for your mind. We do not, and will never, sell your personal data or diary entries to third parties. Period.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <Database className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-xs">What We Collect</h2>
            </div>
            <ul className="space-y-4 text-gray-600 dark:text-gray-300">
              <li className="flex gap-3">
                <span className="font-bold text-indigo-500">•</span>
                <span><strong>Account Info:</strong> We store your email address and name to manage your account and keep your data synced across devices.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-indigo-500">•</span>
                <span><strong>Diary Entries:</strong> We store the text you write so you can access it later. These are encrypted and private to you.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <Lock className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-xs">How We Use AI</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              WinDear uses Google Gemini AI to provide you with insights, mood analysis, and empathetic responses. 
              When you write an entry, it is processed by the AI to help you understand your patterns better. 
              This data is used <strong>only</strong> to serve you within the app. It is not used to train global AI models in a way that identifies you.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <EyeOff className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-xs">Your Control</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              You own your data. You can edit or delete your entries at any time. If you choose to delete your account, all your diary entries and personal information will be permanently removed from our active databases.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <Heart className="w-6 h-6" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-xs">A Human Note</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We are humans building a tool for humans. We treat your data exactly how we would want our own private thoughts to be treated: with absolute respect and care.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-12 border-t border-gray-100 dark:border-[#1A1A1A] text-center">
          <p className="text-sm text-gray-400">Last updated: April 2, 2026</p>
          <p className="mt-2 text-sm text-gray-400">Questions? Reach out to us through the app.</p>
        </div>
      </div>
    </div>
  );
}
