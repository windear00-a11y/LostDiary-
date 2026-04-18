'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatInput } from './ChatInput';
import { generateStoryResponse } from '@/ai-core/ai-engine';
import { useUIStore } from '@/lib/store/use-ui-store';
import { User, Sparkles } from 'lucide-react';
import { coreService, ChatSession } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useSearchParams, useRouter } from 'next/navigation';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'diary';
  content: string;
  created_at: string;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const { setInputFocused, isInputFocused, language } = useUIStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch or find session on mount
  useEffect(() => {
    const initializeSession = async () => {
      const user = await authService.getUser();
      if (!user) return;

      try {
        let targetSessionId = sessionId;

        // 1. If no session in URL, find the latest one
        if (!targetSessionId) {
          const sessions = await coreService.fetchSessions(user.id);
          if (sessions.length > 0) {
            targetSessionId = sessions[0].id;
            // Update URL silently or just set state
            router.replace(`/home?session=${targetSessionId}`);
          } else {
            // No sessions at all? Create a default one
            const newSession = await coreService.createSession(user.id, "First entry");
            targetSessionId = newSession.id;
            router.replace(`/home?session=${targetSessionId}`);
          }
        }

        // 2. Load messages for the determined session
        if (targetSessionId) {
          const history = await coreService.fetchMessages(user.id, targetSessionId);
          const mappedMessages = history.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'diary',
            content: m.content || "",
            created_at: m.created_at
          }));
          setMessages(mappedMessages);

          // 3. Check for inactivity nudge (2 hours)
          if (mappedMessages.length > 0) {
            const lastMsg = mappedMessages[mappedMessages.length - 1];
            const lastTime = new Date(lastMsg.created_at).getTime();
            const now = new Date().getTime();
            const hoursPassed = (now - lastTime) / (1000 * 60 * 60);

            if (hoursPassed > 2) {
              setShowNudge(true);
            }
          } else {
            // Empty session, show greeting
            setShowNudge(true);
          }
        }
      } catch (error) {
        console.error("Session initialization failed:", error);
      }
    };

    initializeSession();
  }, [sessionId, router]);

  const handleStartNewSession = async () => {
    const user = await authService.getUser();
    if (!user) return;
    
    try {
      const newSession = await coreService.createSession(user.id, `Moment ${new Date().toLocaleDateString()}`);
      router.push(`/home?session=${newSession.id}`);
      setShowNudge(false);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

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
      // 2. Persistent Backend Call
      const result = await coreService.sendMessage({
        user_id: user.id,
        session_id: sessionId || undefined,
        type: 'text',
        content: trimmedContent,
        metadata: { language }
      });

      // 3. Update messages using the direct response from API
      // result.aiResponse contains the companion's reply
      if (result.aiResponse) {
        setMessages(prev => prev.map(m => 
          m.id === aiTempId ? { 
            ...m, 
            id: `ai-${Date.now()}`, 
            content: result.aiResponse.content, 
            role: 'diary' 
          } : m
        ));
      } else {
        // Fallback if AI didn't respond (should be rare now)
        setMessages(prev => prev.map(m => 
          m.id === aiTempId ? { ...m, content: "I've saved that for you.", role: 'diary' } : m
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
    <div className="flex flex-col h-full bg-neutral-950 text-white relative overflow-hidden font-sans">
      {/* Messages Container */}
      <div 
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-4 pt-24 pb-20 transition-all duration-700 ${isInputFocused ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}
      >
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Nudge / Motivation UI */}
          <AnimatePresence>
            {showNudge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6 text-center space-y-4 mb-12 shadow-2xl backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-serif italic text-white">Welcome back, Storyteller.</h3>
                  <p className="text-sm text-slate-400 font-serif">Aapki purani yaadein yahan mehfooz hain. Agla panna likhein ya purani baat hi continue karni hai?</p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button 
                    onClick={() => setShowNudge(false)}
                    className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full text-xs font-medium transition-all"
                  >
                    Continue Writing
                  </button>
                  <button 
                    onClick={handleStartNewSession}
                    className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-full text-xs font-medium transition-all shadow-lg"
                  >
                    Start New Chapter
                  </button>
                </div>
                <button 
                  onClick={() => setShowNudge(false)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                  isUser 
                    ? 'bg-neutral-800 border-white/10' 
                    : 'bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5'
                }`}>
                  {isUser ? <User className="w-4 h-4 text-white/50" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl ${
                  isUser 
                    ? 'bg-white text-black rounded-tr-none shadow-xl' 
                    : 'bg-neutral-900 border border-white/10 text-neutral-100 rounded-tl-none shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
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
