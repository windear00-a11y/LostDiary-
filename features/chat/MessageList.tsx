'use client';

import React from 'react';
import { ChatMessage } from '@/lib/services/chat-service';
import { MapPin } from 'lucide-react';

export const MessageList = ({ messages }: { messages: ChatMessage[] }) => {
  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] md:max-w-[75%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100'}`}>
            {msg.type === 'text' && (
              <p className="whitespace-pre-wrap">{msg.original_content || msg.content}</p>
            )}
            
            {msg.type === 'image' && (
              <img src={msg.media_url || ''} alt="Attachment" className="max-w-full rounded-lg object-cover" />
            )}
            
            {msg.type === 'video' && (
              <video src={msg.media_url || ''} controls className="max-w-full rounded-lg" />
            )}
            
            {msg.type === 'audio' && (
              <audio src={msg.media_url || ''} controls className="max-w-full" />
            )}
            
            {msg.type === 'location' && (
              <a 
                href={msg.media_url || ''} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <MapPin className="w-5 h-5" />
                <span>{msg.content || 'Shared Location'}</span>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
