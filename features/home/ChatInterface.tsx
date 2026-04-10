'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { chatService, ChatMessage } from '@/lib/services/chat-service';
import { authService } from '@/lib/services/auth-service';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { StoryPreview } from './StoryPreview';
import { StoryProgressBar } from '@/components/ui/StoryProgressBar';
import { StoryPreviewCard } from '@/features/story/StoryPreviewCard';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5"></div>
  </div>
);

export const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [wowStory, setWowStory] = useState<string | null>(null);
  const [hasShownWow, setHasShownWow] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userMessageCount = messages.filter(m => m.role === 'user').length;

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
        4. Start directly with the story. No intro.
        5. Language: Simple, human, and grounded.
        
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
    "क्या कुछ ऐसा है जो आपको परेशान कर रहा है?",
    "आज आपने अपने बारे में क्या नया सीखा?"
  ];

  useEffect(() => {
    const loadMessages = async () => {
      const user = await authService.getUser();
      if (user) {
        setUserId(user.id);
        const data = await chatService.fetchMessages(user.id);
        setMessages(data);
        
        // Check if we should show the wow moment on load
        const userMessages = data.filter(m => m.role === 'user');
        if (userMessages.length >= 3 && userMessages.length <= 5) {
          generateWowStory(userMessages);
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
  }, [messages, isThinking]);

  const handleSendMessage = async (input: { 
    type: 'text' | 'image' | 'video' | 'audio' | 'location';
    content: string | File | null;
    metadata?: any;
  }) => {
    const user = await authService.getUser();
    if (!user) return;
    
    const newMessage = await chatService.sendMessage({ 
      ...input, 
      user_id: user.id
    });
    setMessages(prev => [...prev, newMessage]);
    setIsThinking(true);

    try {
      // Reload messages to get potential AI reply
      const data = await chatService.fetchMessages(user.id);
      setMessages(data);
      setRefreshKey(prev => prev + 1);

      // Onboarding Wow Moment Trigger
      const userMessages = data.filter(m => m.role === 'user');
      if (userMessages.length >= 3 && userMessages.length <= 5 && !hasShownWow) {
        generateWowStory(userMessages);
      }
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <StoryProgressBar count={userMessageCount} />
      
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 2 }}
          className="px-4 py-1.5 bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-full shadow-sm"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 dark:text-gray-500">
            Your story is being written
          </span>
        </motion.div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-12 px-6 py-8 scrollbar-hide">
        {loading ? (
          <SkeletonLoader />
        ) : messages.length === 0 ? (
          <div className="py-12 text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-serif italic text-gray-800 dark:text-gray-200">This app turns your life into a story.</h2>
              <p className="text-gray-500 dark:text-gray-400">Start writing to begin your journey.</p>
            </div>
            <div className="grid gap-3 max-w-sm mx-auto">
              {prompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage({ type: 'text', content: prompt })}
                  className="p-4 text-sm text-left bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] rounded-2xl hover:border-[#6366F1] transition-all text-gray-600 dark:text-gray-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {userId && <StoryPreviewCard userId={userId} refreshTrigger={refreshKey} />}
            
            <MessageList messages={messages} />
            
            {wowStory && (
              <StoryPreview story={wowStory} />
            )}

            {isThinking && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs font-serif italic text-gray-400"
              >
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                WinDear is reflecting...
              </motion.div>
            )}
          </>
        )}
      </div>
      <div className="mt-auto">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};
