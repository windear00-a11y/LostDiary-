'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, MessageCircle, User, Bot, Loader2, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  entries = []
}: {
  onSendMessage: (message: string) => Promise<string | null>;
  isSubmitting: boolean;
  t: (key: string) => string;
  entries?: any[];
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [dailyPrompt, setDailyPrompt] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial greeting and daily prompt
  useEffect(() => {
    const hour = new Date().getHours();
    let greeting = "I am the soul of your WinDear diary. I'm here to hold your memories. How are you feeling in this moment?";
    if (hour < 12) greeting = "Good morning. I've been waiting for your first thoughts of the day. What's on your mind?";
    else if (hour < 18) greeting = "The day is unfolding. I'm listening to everything you want to share.";
    else greeting = "The stars are out, and I'm here to reflect on the day with you. Let's talk.";

    setMessages([{ id: '1', role: 'assistant', content: greeting, timestamp: new Date() }]);

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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    const response = await onSendMessage(currentInput);
    
    if (response) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  return (
    <section className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm overflow-hidden flex flex-col h-[500px] transition-all duration-500">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 dark:border-[#2E2E2E] flex items-center justify-between bg-indigo-50/30 dark:bg-indigo-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none relative overflow-hidden">
            <Bot className="w-6 h-6 text-white relative z-10" />
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1] 
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute inset-0 bg-white rounded-full"
            />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-serif italic text-gray-900 dark:text-white">WinDear&apos;s Soul</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-gray-400 italic">Connected to your heart</span>
            </div>
          </div>
        </div>
        <HelpCircle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth scrollbar-hide"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-gray-50 dark:bg-[#262626] rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">No conversation yet</p>
              <p className="text-xs text-gray-400">Ask me about your patterns, memories, or for advice.</p>
            </div>
          </div>
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
              <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-gray-50 dark:bg-[#262626] border-gray-100 dark:border-gray-800' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-gray-400" /> : <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-50 dark:bg-[#262626] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-800 shadow-sm'}`}>
                  {msg.content}
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
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
      <div className="p-6 bg-gray-50/50 dark:bg-black/20 border-t border-gray-50 dark:border-[#2E2E2E]">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask WinDear something..."
            className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all active:scale-95 shadow-md shadow-indigo-200 dark:shadow-none"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <p className="mt-3 text-[10px] text-center text-gray-400 font-medium uppercase tracking-widest">
          WinDear remembers your past entries to help you better
        </p>
      </div>
    </section>
  );
}
