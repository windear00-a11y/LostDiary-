'use client';

import React, { useState, useEffect, useRef } from 'react';
import { chatService, ChatMessage } from '@/lib/services/chat-service';
import { authService } from '@/lib/services/auth-service';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

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
  const scrollRef = useRef<HTMLDivElement>(null);

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
        const data = await chatService.fetchMessages(user.id);
        setMessages(data);
      }
      setLoading(false);
    };
    loadMessages();
  }, []);

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
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-12 pb-8 scrollbar-hide">
        {loading ? (
          <SkeletonLoader />
        ) : messages.length === 0 ? (
          <div className="py-12 text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-serif italic text-gray-800 dark:text-gray-200">Welcome to WinDear</h2>
              <p className="text-gray-500 dark:text-gray-400">अपनी भावनाओं को शब्दों में उतारें।</p>
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
            <MessageList messages={messages} />
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
