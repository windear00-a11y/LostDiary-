'use client';

import React from 'react';
import Image from 'next/image';
import { ChatMessage } from '@/lib/services/chat-service';
import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export const MessageList = ({ messages }: { messages: ChatMessage[] }) => {
  return (
    <div className="space-y-6">
      {messages.map((msg) => (
        <motion.div 
          key={msg.id} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`px-6 py-4 rounded-[24px] font-serif text-lg leading-relaxed shadow-sm border border-gray-100 dark:border-white/5 tracking-wide ${
              msg.role === 'user' 
                ? 'bg-accent text-white' 
                : 'bg-white dark:bg-[#1A1A1D] text-text-light dark:text-gray-100'
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

