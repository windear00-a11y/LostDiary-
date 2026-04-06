'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, MessageCircle, User, Bot, Loader2, X, HelpCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function WinDearAssistant({
  onSendMessage,
  isSubmitting,
  t,
  entries = [],
  messages = [],
  persona
}: {
  onSendMessage: (message: string) => Promise<string | null>;
  isSubmitting: boolean;
  t: any;
  entries?: any[];
  messages?: Message[];
  persona: { tone: string, useEmojis: boolean };
}) {
  const [input, setInput] = useState('');
  const [dailyPrompt, setDailyPrompt] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting and daily prompt
  useEffect(() => {
    // Auto-focus input on load
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Generate daily prompt if entries exist
    if (entries.length > 0) {
      const generatePrompt = async () => {
        try {
          const { generateDailyPrompt } = await import('@/lib/ai');
          const prompt = await generateDailyPrompt(entries);
          setDailyPrompt(prompt);
        } catch (error) {
          console.error('Error generating daily prompt:', error);
        }
      };
      generatePrompt();
    }
  }, [entries]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSubmitting]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isSubmitting) return;

    const currentInput = input;
    setInput('');
    // Append persona instructions to the message
    const messageWithPersona = `${currentInput}\n\n[Persona: Tone=${persona.tone}, UseEmojis=${persona.useEmojis}]`;
    await onSendMessage(messageWithPersona);
  };

  return (
    <section className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm overflow-hidden flex flex-col h-full transition-all duration-500">
      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth custom-scrollbar"
      >
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] sm:max-w-[75%] flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-200 dark:border-indigo-800/30 shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 rounded-2xl text-sm leading-relaxed bg-gray-50 dark:bg-[#262626] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-800 shadow-sm">
                <p className="mb-2">I&apos;m here to help you understand your thoughts. Start by writing anything on your mind.</p>
                <div className="p-3 bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Example:</span> &quot;I feel stuck and unmotivated lately...&quot;
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {dailyPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30 mb-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Daily Writing Prompt</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">&quot;{dailyPrompt}&quot;</p>
              <button 
                onClick={() => {
                  const textarea = document.querySelector('textarea');
                  if (textarea) {
                    textarea.value = dailyPrompt;
                    textarea.focus();
                  }
                }}
                className="mt-3 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-widest"
              >
                Use this prompt
              </button>
            </motion.div>
          )}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] sm:max-w-[75%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-gray-50 dark:bg-[#262626] border-gray-100 dark:border-gray-800' : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-200 dark:border-indigo-800/30 shadow-sm'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-gray-400" /> : <Sparkles className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-50 dark:bg-[#262626] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-800 shadow-sm'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-200 dark:border-indigo-800/30 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-gray-50/50 dark:bg-black/20 border-t border-gray-50 dark:border-[#2E2E2E] flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {['Analyze my mood', 'What patterns do I have?', 'Help me clear my mind'].map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setInput(prompt);
                  if (inputRef.current) inputRef.current.focus();
                }}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your thoughts..."
            className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-2xl py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all active:scale-95 shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <Lock className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] text-gray-400 font-medium">Your data is private & encrypted</span>
        </div>
      </div>
    </section>
  );
}
