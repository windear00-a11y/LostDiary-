'use client';

import React, { useState, useEffect, useRef } from 'react';
import { chatService, ChatMessage } from '@/lib/services/chat-service';
import { authService } from '@/lib/services/auth-service';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [messages]);

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

    // Reload messages to get potential AI reply
    const data = await chatService.fetchMessages(user.id);
    setMessages(data);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0A0A0A]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageList messages={messages} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};
