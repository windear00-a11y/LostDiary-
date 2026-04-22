'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft, Lock, Eye, FileText, Scale, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-slate-300 font-sans selection:bg-indigo-500/20 px-6 py-20">
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
             <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <Shield className="w-6 h-6 text-indigo-500" />
             </div>
             <div>
                <h1 className="text-4xl font-serif font-bold text-white">Privacy Policy</h1>
                <p className="text-sm text-slate-500 mt-1 italic">Last updated: April 22, 2026</p>
             </div>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert prose-slate max-w-none space-y-8 leading-relaxed">
          {/* Oath */}
          <section className="bg-indigo-950/20 p-8 rounded-[32px] border border-indigo-500/20">
            <h2 className="text-2xl font-serif font-bold text-white text-center mb-6">The WinDear Oath</h2>
            <ul className="space-y-4 text-sm text-indigo-100/80">
              <li><strong>1. We don&apos;t listen:</strong> We do not have personal access to read your private reflections.</li>
              <li><strong>2. AI is transient:</strong> AI processes your text in the moment to provide insights, but it does not &apos;remember&apos; you in any permanent database.</li>
              <li><strong>3. Your Vault is yours:</strong> No data analytics, no third-party selling, no advertisements. Your data is your property alone.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              1. Our Philosophy
            </h2>
            <p>
              WinDear is built on the principle that the human soul needs a private sanctuary. Unlike standard social platforms, your data is not our product. We do not sell, rent, or trade your personal information. We only collect what is strictly necessary to provide the &quot;Mirror&quot; and &quot;Story&quot; experiences.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              2. Data We Collect
            </h2>
            <p>
              We collect the following &quot;Raw Data&quot; which is encrypted and bound to your account via Row Level Security (RLS):
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Personal Journal Entries:</strong> Encrypted text stored securely in our database.</li>
              <li><strong>Chat Transcripts:</strong> Ephemeral logs of your interactions with our AI and Bridges.</li>
              <li><strong>Account Metadata:</strong> Email (via Google/Supabase Auth), Display Name, and Pen Name.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              3. How We Use Your Data
            </h2>
            <p>
              Your raw data is processed exclusively by our AI Engine to provide emotional insights, generate story chapters, and facilitate meaningful bridges. We use <strong>Google Gemini API</strong> under enterprise privacy standards, ensuring your data is not used to train global models.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              4. &quot;Neural Wash&quot; &amp; Public Data
            </h2>
            <p>
              Before any content is moved from your private vault to the &quot;Global Library&quot;, it undergoes a mandatory Neural Wash. This process proactively generalizes personally identifiable information (PII). Once generalized, this content becomes &quot;Public Data&quot; and is visible to other WinDear users under your Pen Name.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              5. Data Governance & Deletion
            </h2>
            <p>
              You maintain total authority over your data.
            </p>
            <h3 className="text-sm font-bold text-white mt-4">How to Delete Your Account</h3>
            <p className="text-sm text-slate-400">
              You can permanently delete your account and all associated data at any time through the <strong>Account Settings</strong> menu in your profile. Once initiated, all raw data is purged from our active databases within 24 hours. This action is irreversible.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              6. Contact Us
            </h2>
            <p>
              If you have any questions regarding your privacy, please contact us at <strong>privacy@windear.com</strong>. We commit to responding to all inquiries within 48 hours.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="pt-20 border-t border-white/5 pb-10 text-center text-slate-600 text-xs">
          <p>© 2026 WinDear. A sanctuary for the silent.</p>
        </footer>
      </div>

      {/* Decorative Glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
    </main>
  );
}
