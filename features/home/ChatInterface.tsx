'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { coreService, ChatMessage } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useUIStore } from '@/lib/store/use-ui-store';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { StoryPreview } from './StoryPreview';
import { StoryPreviewCard } from '@/features/story/StoryPreviewCard';
import { GoogleGenAI } from "@google/genai";
import { Header } from '@/components/ui/Header';
import { Loader2, Sparkles, PenLine, Heart, BookOpen } from 'lucide-react';
import { generateStoryResponse } from '@/ai-core/ai-engine';
import { OnboardingView } from './OnboardingView';

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
  actions: { icon: any; label: string; color: string; prompt?: string; path?: string }[] 
}> = {
  en: { 
    title: "How was your day?", 
    subtitle: "Every moment becomes part of your story.",
    actions: [
      { icon: Sparkles, label: "Today's Story", color: "text-indigo-500", prompt: "Analyze my recent events and ask me a personalized question about my day to help me write today's story." },
      { icon: PenLine, label: "Write a Memory", color: "text-emerald-500", prompt: "Look at my past memories and ask me a thoughtful question to help me start writing a new memory." },
      { icon: Heart, label: "How did it feel?", color: "text-rose-500", prompt: "Based on my emotional history, ask me a gentle question about how I'm feeling right now." },
      { icon: BookOpen, label: "View LifeBook", color: "text-amber-500", path: "/story" },
    ]
  },
  hi: { 
    title: "आज आपका दिन कैसा रहा?", 
    subtitle: "हर पल आपकी कहानी का हिस्सा बनता है।",
    actions: [
      { icon: Sparkles, label: "आज की कहानी", color: "text-indigo-500", prompt: "Analyze my recent events and ask me a personalized question about my day to help me write today's story." },
      { icon: PenLine, label: "एक याद लिखें", color: "text-emerald-500", prompt: "Look at my past memories and ask me a thoughtful question to help me start writing a new memory." },
      { icon: Heart, label: "कैसा महसूस हुआ?", color: "text-rose-500", prompt: "Based on my emotional history, ask me a gentle question about how I'm feeling right now." },
      { icon: BookOpen, label: "लाइफबुक देखें", color: "text-amber-500", path: "/story" },
    ]
  },
};

export const ChatInterface = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  // Support session ID from query parameter
  const sessionIdFromUrl = searchParams.get('session');
  
  const { language, pendingMessage, setPendingMessage } = useUIStore();
  const t = EMPTY_STATE[language] || EMPTY_STATE.en;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const lastSessionIdRef = useRef<string | null>(sessionIdFromUrl);

  // Debug visibility: Log messages state
  useEffect(() => {
    console.log("messages updated:", messages);
  }, [messages]);

  const [error, setError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wowStory, setWowStory] = useState<string | null>(null);
  const [hasShownWow, setHasShownWow] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);
  const [thoughtStarter, setThoughtStarter] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef<boolean>(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => setShowHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showHint]);

  // Generate a thought starter based on messages
  useEffect(() => {
    if (messages.length > 0 && !isThinking && !isAnalyzing) {
      const timer = setTimeout(() => {
         const prompts = [
           "How did that make you feel?",
           "What's on your mind right now?",
           "Any highlights from today?",
           "Tell me more about that."
         ];
         setThoughtStarter(prompts[Math.floor(Math.random() * prompts.length)]);
      }, 5000); // Show prompt after 5 seconds of inactivity
      return () => clearTimeout(timer);
    } else {
      setThoughtStarter(null);
    }
  }, [messages, isThinking, isAnalyzing]);

  const generateDynamicPrompt = async (actionPrompt: string) => {
    try {
      const context = messages.slice(-5).map(m => m.content).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a gentle, empathetic journaling assistant. 
        The user wants to write a diary entry. 
        Based on their recent diary entries (if any) and the following instruction, generate a single, short, thoughtful question to help them start writing.
        
        Instruction: ${actionPrompt}
        Language: ${language === 'hi' ? 'Hindi' : 'English'}
        
        Recent entries:
        ${context || 'No recent entries.'}
        
        Return ONLY the question, nothing else. Keep it under 15 words.`,
      });

      if (response.text) {
        setThoughtStarter(response.text.trim());
      } else {
        setThoughtStarter(language === 'hi' ? "इस बारे में कुछ और बताएं..." : "Tell me more about this...");
      }
    } catch (error) {
      console.error("Error generating dynamic prompt:", error);
      setThoughtStarter(language === 'hi' ? "इस बारे में कुछ और बताएं..." : "Tell me more about this...");
    }
  };

  const generateWowStory = React.useCallback(async (userMessages: ChatMessage[]) => {
    try {
      const context = userMessages.map(m => m.content).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these diary entries, write a very short, emotional, and clear "mini life story" (4-6 lines). 
        
        Rules:
        1. Tone: Personal, intimate, and deeply reflective. Write as if you are a gentle, observant narrator.
        2. Focus on the essence of what the person is feeling or experiencing.
        3. Include a subtle "internal monologue" or "quiet realization".
        4. Add reflection sentences and internal thoughts to make it deeply personal.
        5. Keep it subtle and real. Avoid clichés.
        6. Start directly with the story. No intro.
        7. Language: Simple, human, and grounded.
        
        Entries:
        ${context}`,
      });

      if (response.text) {
        setWowStory(response.text);
        setHasShownWow(true);
      }
    } catch (error) {
      console.error("Error generating wow story:", error);
    }
  }, []);

  const prompts = [
    "आज आपका दिन कैसा रहा?",
    "कोई ऐसी बात जो आज आपको अच्छी लगी?",
    "क्या कुछ ऐसा है जो आज आपको परेशान कर रहा है?",
    "आज आपने अपने बारे में क्या नया सीखा?"
  ];

  useEffect(() => {
    const loadMessages = async () => {
      // If we are switching sessions, show loading
      if (lastSessionIdRef.current !== sessionIdFromUrl) {
        setLoading(true);
        lastSessionIdRef.current = sessionIdFromUrl;
      }

      const user = await authService.getUser();
      if (user) {
        setUserId(user.id);
        try {
          const data = await coreService.fetchMessages(user.id, sessionIdFromUrl);
          const visibleMessages = data.filter(m => !m.metadata?.is_hidden);
          
          console.log(`Loaded ${visibleMessages.length} messages for session ${sessionIdFromUrl}`);

          setMessages(prev => {
            // Preserve optimistic messages that are still sending or just saved
            const optimisticIds = prev.filter(m => m.status === 'sending' || m.id.startsWith('temp-')).map(m => m.id);
            const optimisticMessages = prev.filter(m => optimisticIds.includes(m.id));
            
            // Filter out server messages that are already represented by optimistic ones
            const filteredServerMessages = visibleMessages.filter(m => !optimisticIds.includes(m.id));
            
            return [...filteredServerMessages, ...optimisticMessages].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
          
          // Check if we should show the wow moment on load
          const userMessages = visibleMessages.filter(m => m.role === 'user');
          if (userMessages.length >= 3 && userMessages.length <= 5) {
            generateWowStory(userMessages);
          }
        } catch (err) {
          setError("Failed to load your story. Please check your connection.");
        }
      }
      setLoading(false);
    };
    loadMessages();
  }, [generateWowStory, sessionIdFromUrl]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, isAnalyzing]);

  const performSendMessage = React.useCallback(async (input: { 
    type: 'text' | 'image' | 'video' | 'audio' | 'location';
    content: string | File | null;
    metadata?: any;
    tempId: string;
  }, sessionId: string) => {
    const user = await authService.getUser();
    if (!user) return;

    setIsAnalyzing(true);
    setError(null);
    isSendingRef.current = true;

    try {
      const newMessage = await coreService.sendMessage({ 
        ...input, 
        user_id: user.id,
        session_id: sessionId,
        metadata: { ...input.metadata, language }
      });
      
      console.log("Message sent successfully:", newMessage);
      setIsThinking(true);

      if (newMessage.event_score && newMessage.event_score > 7) {
        setShowHint(true);
      }

      // Update optimistic message to saved state
      setMessages(prev => {
        const updated = prev.map(m => m.id === input.tempId ? { ...newMessage, status: 'saved' } : m);
        return updated;
      });

      // Reload messages to get potential AI reply
      const data = await coreService.fetchMessages(user.id, sessionId);
      const visibleMessages = data.filter(m => !m.metadata?.is_hidden);
      
      if (visibleMessages.length > 0) {
        setMessages(visibleMessages);
      }
      
      setRefreshKey(prev => prev + 1);

      // Onboarding Wow Moment Trigger
      const userMessages = visibleMessages.filter(m => m.role === 'user');
      if (userMessages.length >= 3 && userMessages.length <= 5 && !hasShownWow) {
        generateWowStory(userMessages);
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      const errorMessage = err.message || "WinDear couldn't hear that. Please try sending again.";
      setError(errorMessage);
      setMessages(prev => prev.map(m => m.id === input.tempId ? { ...m, status: 'error' } : m));
    } finally {
      setIsThinking(false);
      setIsAnalyzing(false);
      isSendingRef.current = false;
    }
  }, [language, hasShownWow, generateWowStory]);

  // Handle pending message from redirect - Unified logic
  useEffect(() => {
    const processPendingMessage = async () => {
      if (pendingMessage && sessionIdFromUrl === pendingMessage.session_id && !isSendingRef.current) {
        console.log("Processing pending message for session:", sessionIdFromUrl);
        
        // Add to local state optimistically if not already there
        setMessages(prev => {
          if (prev.some(m => m.id === pendingMessage.id)) return prev;
          return [...prev, pendingMessage];
        });

        const msgToProcess = { ...pendingMessage };
        setPendingMessage(null); // Clear immediately to prevent double processing

        // Trigger the actual send logic
        await performSendMessage({
          type: msgToProcess.type as any,
          content: msgToProcess.content,
          metadata: msgToProcess.metadata,
          tempId: msgToProcess.id
        }, msgToProcess.session_id);
      }
    };
    
    processPendingMessage();
  }, [pendingMessage, sessionIdFromUrl, setPendingMessage, performSendMessage]);

  const handleSendMessage = async (input: { 
    type: 'text' | 'image' | 'video' | 'audio' | 'location';
    content: string | File | null;
    metadata?: any;
  }) => {
    const user = await authService.getUser();
    if (!user) return;
    
    if (isSendingRef.current) return;

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
    
    // CASE 1: New Session needed
    if (!activeSessionId) {
      try {
        const newSession = await coreService.createSession(user.id, "Chat " + new Date().toLocaleDateString());
        activeSessionId = newSession.id;
        
        // Handoff to the new page instance
        setPendingMessage({ ...optimisticMsg, session_id: activeSessionId });
        router.push(`/home?session=${activeSessionId}`);
        return; // Stop here, the new page will take over via useEffect
      } catch (err) {
        console.error("Failed to create session:", err);
        setError("Failed to start a new story session.");
        return;
      }
    }

    // 1. Instantly render user message
    setMessages(prev => [...prev, optimisticMsg]);
    setThoughtStarter(null);
    setSelectedActionIndex(null);

    // 2. Show "Thinking..." loader
    setIsThinking(true);

    // 3. Call ai-engine.ts and backend in parallel
    const aiResponsePromise = typeof input.content === 'string' 
      ? generateStoryResponse(input.content, messages.slice(-5).map(m => ({ content: m.content, role: m.role })))
      : Promise.resolve(null);

    // Backend call for saving/background processing
    const backendPromise = performSendMessage({ ...input, tempId }, activeSessionId);

    // 4. On response, replace loader with AI message
    const [aiResponse] = await Promise.all([aiResponsePromise, backendPromise]);

    if (aiResponse) {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        user_id: user.id,
        session_id: activeSessionId,
        role: 'diary',
        type: 'text',
        content: aiResponse,
        media_url: null,
        metadata: {},
        created_at: new Date().toISOString(),
        status: 'saved'
      };
      
      // 7. Smooth fade-in animation for AI message
      setMessages(prev => [...prev, aiMsg]);
    }

    setIsThinking(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d] transition-colors duration-500 relative">
      {/* Immersive Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex flex-col items-center justify-center bg-gradient-to-b from-[#fdfcfb] to-transparent dark:from-[#0d0d0d] dark:to-transparent">
        <h1 className="text-xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">WinDear</h1>
        <p className="text-xs font-serif italic text-slate-500 dark:text-slate-400 mt-1">I&apos;m listening...</p>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-full shadow-lg flex items-center gap-2"
          >
            <span className="text-xs font-medium text-red-600 dark:text-red-400">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide pt-28 pb-32 relative z-10">
        <div className="max-w-3xl mx-auto px-4 md:px-6 min-h-full flex flex-col justify-end">
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
              <OnboardingView onStart={() => {}} />
            ) : (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-6"
              >
                <MessageList messages={messages} onReply={setReplyingTo} />
                
                {wowStory && (
                  <StoryPreview story={wowStory} />
                )}

                <AnimatePresence>
                  {showHint && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex justify-center"
                    >
                      <div className="bg-accent/10 text-accent px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        This feels special...
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isThinking && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2 text-xs font-serif italic text-slate-500 dark:text-slate-400">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      I&apos;m thinking about what you said...
                    </div>
                    {/* Story moment hint for long responses */}
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3 }}
                      className="text-[10px] text-slate-400 dark:text-slate-500 font-serif italic"
                    >
                      Let&apos;s turn this into something meaningful...
                    </motion.p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 z-40 w-full bg-gradient-to-t from-[#fdfcfb] to-transparent dark:from-[#0d0d0d] dark:to-transparent">
        <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 px-4 max-w-3xl mx-auto w-full">
          <ChatInput 
            onSendMessage={async (msg) => {
              setThoughtStarter(null);
              setSelectedActionIndex(null);
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
