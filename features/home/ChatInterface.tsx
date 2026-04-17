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
  const { language, isInputFocused, setInputFocused } = useUIStore();
  
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

  // Handle keyboard visibility (ios/android)
  useEffect(() => {
    const handleResize = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="flex flex-col h-[100dvh] bg-transparent relative overflow-hidden">
      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isInputFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] pointer-events-none"
          />
        )}
      </AnimatePresence>

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
        className={`flex-1 overflow-y-auto scrollbar-hide pt-20 pb-4 px-4 md:px-6 transition-opacity duration-500 ${isInputFocused ? 'opacity-30 grayscale-[0.2]' : 'opacity-100'}`}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {loading ? (
            <LoadingSpace className="h-[50vh]" />
          ) : (
            <>
              <MessageList messages={messages} />
            </>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className={`sticky bottom-0 w-full z-40 bg-transparent px-4 pt-2 pb-[env(safe-area-inset-bottom)] transition-all duration-300 ${isInputFocused ? 'pb-8' : ''}`}>
        <div className={`max-w-3xl mx-auto pb-4 transition-all duration-500 ${isInputFocused ? 'scale-[1.02]' : 'scale-100'}`}>
          <ChatInput 
            onSendMessage={handleSendMessage} 
            disabled={isThinking} 
            onFocusChange={setInputFocused}
          />
        </div>
      </div>
    </div>
  );
};
