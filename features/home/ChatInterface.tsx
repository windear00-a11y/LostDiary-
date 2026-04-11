'use client';

import React, { useState, useEffect, useRef } from 'react';
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

import { useRouter } from 'next/navigation';

export const ChatInterface = () => {
  const router = useRouter();
  const { language } = useUIStore();
  const t = EMPTY_STATE[language] || EMPTY_STATE.en;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wowStory, setWowStory] = useState<string | null>(null);
  const [hasShownWow, setHasShownWow] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const user = await authService.getUser();
      if (user) {
        setUserId(user.id);
        try {
          const data = await chatService.fetchMessages(user.id);
          setMessages(data);
          
          // Check if we should show the wow moment on load
          const userMessages = data.filter(m => m.role === 'user');
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
  }, [generateWowStory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, isAnalyzing]);

  const { language } = useUIStore();

  const handleSendMessage = async (input: { 
    type: 'text' | 'image' | 'video' | 'audio' | 'location';
    content: string | File | null;
    metadata?: any;
  }) => {
    const user = await authService.getUser();
    if (!user) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const newMessage = await chatService.sendMessage({ 
        ...input, 
        user_id: user.id,
        metadata: { ...input.metadata, language }
      });
      setMessages(prev => [...prev, newMessage]);
      setIsThinking(true);

      if (newMessage.event_score && newMessage.event_score > 7) {
        setShowHint(true);
      }

      // Reload messages to get potential AI reply
      const data = await chatService.fetchMessages(user.id);
      setMessages(data);
      setRefreshKey(prev => prev + 1);

      // Onboarding Wow Moment Trigger
      const userMessages = data.filter(m => m.role === 'user');
      if (userMessages.length >= 3 && userMessages.length <= 5 && !hasShownWow) {
        generateWowStory(userMessages);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("WinDear couldn't hear that. Please try sending again.");
    } finally {
      setIsThinking(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-500">
      <Header />
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide pt-24 pb-32">
        <div className="max-w-3xl mx-auto px-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-md px-4">
                {t.actions.map((action, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (action.path) {
                        router.push(action.path);
                      } else if (action.prompt) {
                        handleSendMessage({ type: 'text', content: action.prompt });
                      }
                    }}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5 shadow-sm transition-all text-left"
                  >
                    <div className="shrink-0"><action.icon className={`w-5 h-5 ${action.color}`} /></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 font-serif italic">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {userId && <StoryPreviewCard userId={userId} refreshTrigger={refreshKey} />}
              
              <MessageList messages={messages} />
              
              {wowStory && (
                <StoryPreview story={wowStory} />
              )}

              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-center"
                  >
                    <div className="px-4 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-full border border-gray-100 dark:border-white/5 text-[11px] font-medium text-gray-400 uppercase tracking-widest">
                      Saving your moment...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showHint && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex justify-center"
                  >
                    <div className="bg-accent/10 text-accent px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      This might become a chapter
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
                  WinDear is reflecting...
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

