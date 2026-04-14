'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { chatService, ChatMessage } from '@/lib/services/chat-service';
import { authService } from '@/lib/services/auth-service';
import { useUIStore } from '@/lib/store/use-ui-store';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { StoryPreview } from './StoryPreview';
import { StoryPreviewCard } from '@/features/story/StoryPreviewCard';
import { GoogleGenAI } from "@google/genai";
import { Header } from '@/components/ui/Header';
import { Loader2, Image as ImageIcon, Sparkles, PenLine, Heart, BookOpen } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5"></div>
  </div>
);

const EMPTY_STATE: Record<string, { 
  title: string; 
  subtitle: string; 
}> = {
  en: { 
    title: "Hello, I'm WinDear", 
    subtitle: "Your AI companion. How can I help you today?",
  },
  hi: { 
    title: "नमस्ते, मैं WinDear हूँ", 
    subtitle: "आपका AI साथी। आज मैं आपकी क्या मदद कर सकता हूँ?",
  },
};

export const ChatInterface = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  // Support both ?session= and /chat/[id]
  const sessionIdFromUrl = (params.id as string) || searchParams.get('session');
  
  const { language, pendingMessage, setPendingMessage } = useUIStore();
  const t = EMPTY_STATE[language] || EMPTY_STATE.en;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const lastSessionIdRef = useRef<string | null>(sessionIdFromUrl);

  // Handle pending message from redirect
  useEffect(() => {
    if (pendingMessage && sessionIdFromUrl === pendingMessage.session_id) {
      setMessages(prev => {
        if (prev.some(m => m.id === pendingMessage.id)) return prev;
        return [...prev, pendingMessage];
      });
      setPendingMessage(null);
    }
  }, [pendingMessage, sessionIdFromUrl, setPendingMessage]);

  // Debug visibility: Log messages state
  useEffect(() => {
    console.log("messages updated:", messages);
  }, [messages]);

  const [error, setError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef<boolean>(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, isAnalyzing]);

  const handleSendMessage = async (input: { 
    type: 'text' | 'image' | 'video' | 'audio' | 'location';
    content: string | File | null;
    metadata?: any;
  }) => {
    const user = await authService.getUser();
    if (!user) return;
    
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    // Define optimistic message early so it can be used for hand-off during redirect
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      user_id: user.id,
      session_id: sessionIdFromUrl || undefined,
      role: 'user',
      type: input.type,
      content: typeof input.content === 'string' ? input.content : (input.type === 'image' ? '📷 Image' : '📎 Attachment'),
      media_url: null,
      metadata: { ...input.metadata, language },
      created_at: new Date().toISOString(),
      status: 'sending'
    };
    
    let activeSessionId = sessionIdFromUrl;
    if (!activeSessionId) {
      try {
        const newSession = await chatService.createSession(user.id, "Chat " + new Date().toLocaleDateString());
        activeSessionId = newSession.id;
        
        // Task: Preserving optimistic state during redirect
        setPendingMessage({ ...optimisticMsg, session_id: activeSessionId });
        
        router.push(`/chat/${activeSessionId}`);
        lastSessionIdRef.current = activeSessionId;
        console.log("Created new session and redirecting:", activeSessionId);
      } catch (err) {
        console.error("Failed to create session:", err);
        isSendingRef.current = false;
        return;
      }
    }

    if (!input.metadata?.is_hidden) {
      // Task 1: Fix state update (CRITICAL) - Use functional update
      setMessages(prev => [...prev, { ...optimisticMsg, session_id: activeSessionId || undefined }]);
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const newMessage = await chatService.sendMessage({ 
        ...input, 
        user_id: user.id,
        session_id: activeSessionId || undefined,
        metadata: { ...input.metadata, language }
      });
      
      console.log("Message sent successfully:", newMessage);
      setIsThinking(true);

      // Update optimistic message to saved state before refetching to make it instant
      setMessages(prev => {
        const updated = prev.map(m => m.id === tempId ? { ...newMessage, status: 'saved' } : m);
        return updated;
      });

      // Reload messages to get the real user message (replacing temp) and potential AI reply
      const data = await chatService.fetchMessages(user.id, activeSessionId);
      const visibleMessages = data.filter(m => !m.metadata?.is_hidden);
      
      if (visibleMessages.length > 0) {
        setMessages(visibleMessages);
      }
      
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error("Failed to send message:", err);
      const errorMessage = err.message || "WinDear couldn't hear that. Please try sending again.";
      setError(errorMessage);
      // Mark optimistic message as error instead of removing it
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    } finally {
      setIsThinking(false);
      setIsAnalyzing(false);
      isSendingRef.current = false;
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark transition-colors duration-500 relative">
      {/* Subtle Chat Wallpaper Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <Header />
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-full shadow-lg flex items-center gap-2"
          >
            <span className="text-xs font-medium text-red-600 dark:text-red-400">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide pt-24 pb-6 relative z-10">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatePresence>
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[60vh]"
              >
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              </motion.div>
            ) : (messages.length === 0 && !sessionIdFromUrl) ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12 py-12"
              >
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-serif font-medium text-gray-900 dark:text-gray-100 px-4 tracking-tight">
                    {t.title}
                  </h2>
                  <p className="text-lg text-gray-500 dark:text-gray-400 font-serif italic">
                    {t.subtitle}
                  </p>
                </div>
              </motion.div>
            ) : (messages.length === 0 && sessionIdFromUrl) ? (
              <motion.div 
                key="session-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4"
              >
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 italic">
                  {language === 'hi' ? 'नमस्ते! मैं आपकी क्या मदद कर सकता हूँ?' : 'Hello! How can I help you today?'}
                </h2>
              </motion.div>
            ) : (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-6"
              >
                <MessageList messages={messages} onReply={setReplyingTo} />
                
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex justify-center"
                    >
                      <div className="px-4 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-full border border-gray-100 dark:border-white/5 text-[11px] font-medium text-gray-400 uppercase tracking-widest">
                        Sending...
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isThinking && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-xs font-serif italic text-gray-400"
                  >
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    WinDear is typing...
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative shrink-0 z-40 bg-bg-light dark:bg-bg-dark w-full">
        <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 px-4 max-w-3xl mx-auto w-full relative">
          <ChatInput 
            onSendMessage={async (msg) => {
              await handleSendMessage(msg);
            }} 
            replyingTo={replyingTo} 
            onClearReply={() => setReplyingTo(null)} 
          />
        </div>
      </div>
    </div>
  );
};

