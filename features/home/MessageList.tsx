'use client';

import React from 'react';
import Image from 'next/image';
import { ChatMessage } from '@/lib/services/chat-service';
import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export const MessageList = ({ messages }: { messages: ChatMessage[] }) => {
  return (
    <div className="space-y-12">
      {messages.map((msg) => (
        <motion.div 
          key={msg.id} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`p-6 rounded-3xl font-serif text-lg leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[#111827] text-[#fdfcfb] dark:bg-[#fdfcfb] dark:text-[#111827]' 
                : 'bg-gray-50 text-[#111827] dark:bg-[#1A1A1A] dark:text-[#fdfcfb]'
            }`}>
              {msg.type === 'text' && (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              
              {msg.type === 'image' && (
                <div className="relative w-full aspect-video min-w-[200px] mt-2">
                  <Image 
                    src={msg.media_url || ''} 
                    alt="Attachment" 
                    fill
                    className="rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              
              {msg.type === 'video' && (
                <video src={msg.media_url || ''} controls className="max-w-full rounded-2xl mt-2" />
              )}
              
              {msg.type === 'audio' && (
                <audio src={msg.media_url || ''} controls className="max-w-full mt-2" />
              )}
              
              {msg.type === 'location' && (
                <a 
                  href={msg.media_url || ''} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:underline mt-2"
                >
                  <MapPin className="w-5 h-5" />
                  <span>{msg.content || 'Shared Location'}</span>
                </a>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
