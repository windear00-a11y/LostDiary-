'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { coreService, ChatMessage } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useUIStore } from '@/lib/store/use-ui-store';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { generateStoryResponse } from '@/ai-core/ai-engine';

export const ChatInterface = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { language } = useUIStore();
  
  // Minimal core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        const user = await authService.getUser();
        if (!user) return;

        const history = await coreService.fetchMessages(user.id, sessionId);
        setMessages(history.filter(m => !m.metadata?.is_hidden));
      } catch (err) {
        setError("Couldn't load your story.");
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isThinking]);

  const handleSendMessage = async (input: { type: 'text'; content: string }) => {
    const user = await authService.getUser();
    if (!user || !input.content.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      user_id: user.id,
      session_id: sessionId || undefined,
      role: 'user',
      type: 'text',
      content: input.content,
      media_url: null,
      metadata: { language },
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    // 1. Show user message instantly
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      // 2. Parallel AI response and database save
      const [aiResponse] = await Promise.all([
        generateStoryResponse(input.content, messages.slice(-5).map(m => ({ content: m.content, role: m.role }))),
        coreService.sendMessage({ 
          ...input, 
          user_id: user.id,
          session_id: sessionId || '',
          metadata: { language }
        })
      ]);

      if (aiResponse) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          user_id: user.id,
          session_id: sessionId || undefined,
          role: 'diary',
          type: 'text',
          content: aiResponse,
          media_url: null,
          metadata: {},
          created_at: new Date().toISOString(),
          status: 'saved'
        };
        
        // 3. Show AI response
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      setError("Failed to process message.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-full shadow-lg"
          >
            <span className="text-xs font-medium text-red-600 dark:text-red-400">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto scrollbar-hide pt-20 pb-12 px-4 md:px-6"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {loading ? (
            <LoadingSpace className="h-[50vh]" />
          ) : (
            <>
              <MessageList messages={messages} />
              
              {/* Thinking Indicator */}
              <AnimatePresence>
                {isThinking && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-2 pl-4 border-l-2 border-indigo-500/20"
                  >
                    <div className="flex items-center gap-3 text-sm font-serif italic text-slate-500 dark:text-slate-400">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div 
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }} 
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} 
                            className="w-1.5 h-1.5 bg-indigo-400 rounded-full" 
                          />
                        ))}
                      </div>
                      Thinking...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="sticky bottom-0 left-0 right-0 z-40 p-4 pt-8 bg-gradient-to-t from-[#fdfcfb] via-[#fdfcfb]/90 to-transparent dark:from-[#0d0d0d] dark:via-[#0d0d0d]/90">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} disabled={isThinking} />
        </div>
      </div>
    </div>
  );
};
