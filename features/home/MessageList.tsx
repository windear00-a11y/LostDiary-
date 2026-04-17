'use client';

import React from 'react';
import { ChatMessage } from '@/lib/services/core-service';
import { motion } from 'motion/react';
import { User, Sparkles } from 'lucide-react';

export const MessageList = ({ messages }: { messages: ChatMessage[] }) => {
  if (!messages) return null;

  return (
    <div className="space-y-8 pb-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const showAvatar = index === 0 || messages[index - 1].role !== msg.role;

        return (
          <motion.div 
            key={msg.id || index} 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: 'spring',
              damping: 25,
              stiffness: 200,
              delay: 0.05
            }}
            className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Simple Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isUser ? 'bg-indigo-500/10' : 'bg-emerald-500/10'
            } ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
              {isUser ? (
                <User className="w-4 h-4 text-indigo-500" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-500" />
              )}
            </div>

            {/* Clean Message Bubble */}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-indigo-500 text-white rounded-tr-none' 
                : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none shadow-sm'
            }`}>
              <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

