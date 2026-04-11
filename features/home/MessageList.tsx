'use client';

import { ChatMessage } from '@/lib/services/chat-service';
import { MapPin, User, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const MessageList = ({ messages }: { messages: ChatMessage[] }) => {
  return (
    <div className="space-y-8 pb-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const showAvatar = index === 0 || messages[index - 1].role !== msg.role;

        return (
          <motion.div 
            key={msg.id} 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-100 dark:border-white/5 ${
              isUser ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'
            } ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
              {isUser ? (
                <User className="w-4 h-4 text-indigo-500" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-500" />
              )}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[85%] md:max-w-[70%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
              <div className={`relative px-5 py-3.5 shadow-sm border ${
                isUser 
                  ? 'bg-indigo-600 border-indigo-500 text-white rounded-t-[24px] rounded-bl-[24px] rounded-br-[4px]' 
                  : 'bg-white dark:bg-[#1A1A1D] border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-t-[24px] rounded-br-[24px] rounded-bl-[4px]'
              }`}>
                {msg.type === 'text' && (
                  <p className="text-[15px] leading-relaxed font-serif italic whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}
                
                {msg.type === 'image' && (
                  <div className="relative w-full overflow-hidden rounded-xl mt-1">
                    <img 
                      src={msg.media_url || ''} 
                      alt="Attachment" 
                      className="w-full h-auto object-cover max-h-[400px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                
                {msg.type === 'video' && (
                  <video src={msg.media_url || ''} controls className="max-w-full rounded-xl mt-1" />
                )}
                
                {msg.type === 'audio' && (
                  <audio src={msg.media_url || ''} controls className="max-w-full mt-1" />
                )}
                
                {msg.type === 'location' && (
                  <a 
                    href={msg.media_url || ''} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline mt-1 text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{msg.content || 'Shared Location'}</span>
                  </a>
                )}
              </div>
              
              {/* Timestamp placeholder or small label */}
              <p className={`text-[9px] font-bold uppercase tracking-widest text-gray-400 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
                {isUser ? 'You' : 'WinDear'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

