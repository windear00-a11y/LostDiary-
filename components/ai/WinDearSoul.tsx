import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BrainCircuit, Heart, Lightbulb, ChevronRight, Activity, MessageCircle, Send, Loader2, User, Bot, Trash2 } from 'lucide-react';
import { useSelectedEntry, useDiaryStore } from '@/lib/store/use-diary-store';
import { handleChat, classifyIntent } from '@/lib/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const WinDearSoul = () => {
  const selectedEntry = useSelectedEntry();
  const entries = useDiaryStore((state) => state.entries);
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const intent = await classifyIntent(userMessage.content);
      const response = await handleChat(
        userMessage.content,
        entries,
        'en',
        intent as any,
        { tone: 'supportive', useEmojis: true }
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50';
      case 'sad': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50';
      case 'angry': return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50';
      case 'anxious': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50';
      case 'calm': return 'text-teal-500 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50';
      default: return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50';
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-md opacity-50 rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-full text-white">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              WinDear Soul
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Your AI Companion</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'insights'
              ? 'bg-white dark:bg-[#262626] text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          Insights
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-[#262626] text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Chat
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'insights' ? (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar"
            >
              {!selectedEntry ? (
                <div className="flex flex-col items-center justify-center h-40 text-center space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-[#1A1A1A] rounded-full">
                    <BrainCircuit className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select a diary entry to reveal deep insights, mood analysis, and reflections.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Mood Analysis */}
                  {selectedEntry.mood && (
                    <div className={`p-4 rounded-2xl border ${getMoodColor(selectedEntry.mood)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4" />
                        <span className="font-bold text-xs uppercase tracking-widest">Detected Mood</span>
                      </div>
                      <p className="text-sm font-medium capitalize">{selectedEntry.mood}</p>
                    </div>
                  )}

                  {/* Summary */}
                  {selectedEntry.summary && (
                    <div className="bg-gray-50 dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-100 dark:border-[#2E2E2E]">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="font-bold text-xs uppercase tracking-widest">Summary</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {selectedEntry.summary}
                      </p>
                    </div>
                  )}

                  {/* Insight */}
                  {selectedEntry.insight && (
                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-2">
                        <BrainCircuit className="w-4 h-4" />
                        <span className="font-bold text-xs uppercase tracking-widest">Deep Insight</span>
                      </div>
                      <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed italic font-serif">
                        &quot;{selectedEntry.insight}&quot;
                      </p>
                    </div>
                  )}

                  {/* Suggestion */}
                  {selectedEntry.suggestion && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-2">
                        <Lightbulb className="w-4 h-4" />
                        <span className="font-bold text-xs uppercase tracking-widest">Reflection</span>
                      </div>
                      <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
                        {selectedEntry.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                      <MessageCircle className="w-8 h-8 text-indigo-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ask me anything about your journey. I remember everything you&apos;ve shared.
                    </p>
                    <div className="grid grid-cols-1 gap-2 w-full">
                      {[
                        "Summarize my week",
                        "What patterns do you see?",
                        "How has my mood been?",
                        "Remind me about my goals"
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setInput(suggestion);
                          }}
                          className="text-xs text-left px-4 py-2 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl border border-gray-100 dark:border-[#2E2E2E] transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-[#2E2E2E]'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="p-3 rounded-2xl bg-gray-100 dark:bg-[#1A1A1A] text-gray-500 rounded-tl-none border border-gray-200 dark:border-[#2E2E2E]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask WinDear Soul..."
                  className="w-full bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="mt-2 text-[10px] text-gray-400 hover:text-red-400 flex items-center gap-1 mx-auto transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Chat
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
