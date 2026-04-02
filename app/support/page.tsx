'use client';

import { useState } from 'react';
import { ArrowLeft, Send, Mail, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

export default function SupportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#F9FAFB] selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      <div className="max-w-xl mx-auto px-6 py-12 sm:py-20 space-y-12">
        {/* Header */}
        <div className="space-y-6">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Support</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            Need help or have a suggestion? We&apos;re here for you.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1A1A] p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 dark:shadow-none border border-gray-100 dark:border-[#2E2E2E] space-y-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-[#6B7280] dark:text-gray-500 ml-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-[#262626] border-none rounded-2xl text-sm text-[#111827] dark:text-[#F9FAFB] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-[#6B7280] dark:text-gray-500 ml-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-[#262626] border-none rounded-2xl text-sm text-[#111827] dark:text-[#F9FAFB] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-[#6B7280] dark:text-gray-500 ml-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help?"
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-[#262626] border-none rounded-2xl text-sm text-[#111827] dark:text-[#F9FAFB] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#111827] dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] py-5 rounded-2xl font-semibold hover:bg-[#1f2937] dark:hover:bg-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 dark:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-6 border-t border-gray-50 dark:border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span>support@windear.app</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <span>Typical response: 24h</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-[#1A1A1A] p-12 rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] text-center space-y-6"
            >
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif italic text-[#111827] dark:text-[#F9FAFB]">Message Sent!</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Thank you for reaching out. We&apos;ve received your message and will get back to you as soon as possible.
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Return to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
