'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatInput } from './ChatInput';
import { generateStoryResponse } from '@/ai-core/ai-engine';
import { useUIStore } from '@/lib/store/use-ui-store';
import { User, Sparkles } from 'lucide-react';
import { coreService } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'diary';
  content: string;
  created_at: string;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const { setInputFocused, isInputFocused } = useUIStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      const user = await authService.getUser();
      if (user) {
        try {
          const history = await coreService.fetchMessages(user.id);
          // Map backend roles to frontend roles
          const mappedMessages = history.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'diary',
            content: m.content || "",
            created_at: m.created_at
          }));
          setMessages(mappedMessages);
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      }
    };
    loadMessages();
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendMessage = async (input: { type: 'text'; content: string }) => {
    const trimmedContent = input.content.trim();
    const user = await authService.getUser();
    if (!trimmedContent || isThinking || !user) return;

    // 1. Optimistic Update (Show user message instantly)
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedContent,
      created_at: new Date().toISOString(),
    };

    const aiTempId = `temp-${Date.now()}`;
    const aiTempMsg: ChatMessage = {
      id: aiTempId,
      role: 'ai',
      content: 'Thinking...',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg, aiTempMsg]);
    setIsThinking(true);

    try {
      // 2. Persistent Backend Call (This triggers AI orchestration and auto-saving chapters on server)
      const persistentMsg = await coreService.sendMessage({
        user_id: user.id,
        type: 'text',
        content: trimmedContent,
        metadata: { language: 'en' }
      });

      // 3. Update messages after backend completes (it handles DB save for both user and AI)
      // We fetch the latest messages to sync with the DB (including AI response)
      const updatedMessages = await coreService.fetchMessages(user.id);
      
      // Filter out our optimistic/temp ones and replace with real ones
      const lastAiResponse = updatedMessages.findLast(m => m.role === 'diary' && m.created_at >= userMsg.created_at);
      
      if (lastAiResponse) {
        setMessages(prev => prev.map(m => 
          m.id === aiTempId ? { ...m, id: lastAiResponse.id, content: lastAiResponse.content || "...", role: 'diary' } : m
        ));
      } else {
        // Fallback if AI didn't respond or sync was slow
        setMessages(prev => prev.map(m => 
          m.id === aiTempId ? { ...m, content: "I've saved that to your LifeBook.", role: 'diary' } : m
        ));
      }
    } catch (error) {
      console.error("Failed to sync message with backend:", error);
      setMessages(prev => prev.map(m => 
        m.id === aiTempId ? { ...m, content: "The diary is quiet, but your memory is safe." } : m
      ));
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-neutral-950 text-white relative overflow-hidden font-sans">
      {/* Messages Container */}
      <div 
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6 transition-all duration-700 ${isInputFocused ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}
      >
        <div className="max-w-2xl mx-auto space-y-8">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isThinkingMsg = msg.content === 'Thinking...';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/5 ${isUser ? 'bg-white/5' : 'bg-white/10'}`}>
                  {isUser ? <User className="w-4 h-4 text-white/50" /> : <Sparkles className="w-4 h-4 text-white/70" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl ${
                  isUser 
                    ? 'bg-white text-black rounded-tr-none' 
                    : 'bg-neutral-900 border border-white/10 text-neutral-100 rounded-tl-none shadow-xl'
                }`}>
                  {isThinkingMsg ? (
                    <div className="flex gap-1 py-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 bg-white/40 rounded-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm md:text-base leading-relaxed tracking-wide whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Input Section */}
      <div className="sticky bottom-0 w-full z-20 px-4 pb-[env(safe-area-inset-bottom)] bg-neutral-950/80 backdrop-blur-sm">
        <div className={`pt-2 pb-6 max-w-3xl mx-auto transition-all duration-500 ${isInputFocused ? 'pb-8 scale-[1.01]' : 'pb-4'}`}>
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
