'use client';

import React, { useState, useEffect } from 'react';
import { ChatMessage } from '@/lib/services/chat-service';
import { MapPin, User, Sparkles, Reply, Feather, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

// Helper to extract URLs from text
const extractUrls = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];
  return urls;
};

const SendingIndicator = () => {
  const [symbols, setSymbols] = useState([
    { char: '?', color: 'text-cyan-400', glow: 'drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]' },
    { char: '!', color: 'text-fuchsia-400', glow: 'drop-shadow-[0_0_6px_rgba(232,121,249,0.8)]' },
    { char: '*', color: 'text-amber-400', glow: 'drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]' }
  ]);
  
  useEffect(() => {
    // Using soft, magical, and thought-provoking symbols suitable for a diary/AI companion
    const chars = ['✧', '✦', '⋆', '°', '~', '*', '+', '?', '·', '∘'];
    const colors = [
      { c: 'text-cyan-400', g: 'drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]' },
      { c: 'text-fuchsia-400', g: 'drop-shadow-[0_0_6px_rgba(232,121,249,0.8)]' },
      { c: 'text-amber-400', g: 'drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]' },
      { c: 'text-emerald-400', g: 'drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]' },
      { c: 'text-violet-400', g: 'drop-shadow-[0_0_6px_rgba(167,139,250,0.8)]' },
      { c: 'text-rose-400', g: 'drop-shadow-[0_0_6px_rgba(251,113,133,0.8)]' }
    ];

    const interval = setInterval(() => {
      setSymbols([0, 1, 2].map(() => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const style = colors[Math.floor(Math.random() * colors.length)];
        return { char, color: style.c, glow: style.g };
      }));
    }, 600); // Slower interval for a softer feel
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-0.5 font-bold text-[12px] tracking-tighter w-8 justify-center">
      {symbols.map((sym, i) => (
        <motion.span
          key={i}
          animate={{
            y: [0, -3, 0],
            opacity: [0.6, 1, 0.6],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2
          }}
          className={`${sym.color} ${sym.glow} inline-block transition-colors duration-500`}
        >
          {sym.char}
        </motion.span>
      ))}
    </div>
  );
};

export const MessageList = ({ messages, onReply }: { messages: ChatMessage[], onReply?: (msg: ChatMessage) => void }) => {
  // Task 4: Prevent undefined/null issues
  if (!messages) return null;

  return (
    <div className="space-y-8 pb-4">
      {/* Task 3: Fix message rendering - Use optional chaining and fallback key */}
      {messages?.map((msg, index) => {
        const isUser = msg.role === 'user';
        const showAvatar = index === 0 || messages[index - 1].role !== msg.role;

        return (
          <motion.div 
            key={msg.id || index} 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              ...(isUser ? {
                y: [0, -4, 0],
              } : {})
            }}
            transition={{ 
              duration: 0.4, 
              ease: [0.23, 1, 0.32, 1],
              ...(isUser ? {
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              } : {})
            }}
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
            <div className={`max-w-[85%] md:max-w-[70%] space-y-1 ${isUser ? 'items-end' : 'items-start'} group relative`}>
              
              {/* Reply Button (Visible on hover) */}
              {onReply && (
                <button 
                  onClick={() => onReply(msg)}
                  className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? '-left-10' : '-right-10'}`}
                >
                  <Reply className="w-4 h-4 text-gray-500" />
                </button>
              )}

              <div className={`relative px-6 py-4 max-w-[85%] md:max-w-[70%] text-white text-lg leading-snug rounded-[40px] backdrop-blur-xl transition-all duration-500 ${
                !isUser ? "bg-cyan-400/20" : "bg-purple-500/20"
              }`}>
                {/* Glow Layer */}
                <div
                  className={`
                    absolute inset-0 rounded-[40px] blur-2xl opacity-70 pointer-events-none
                    ${!isUser ? "bg-cyan-400" : "bg-purple-500"}
                  `}
                />

                {/* Cloud texture illusion */}
                <div
                  className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_30%_30%,white_10%,transparent_60%)] opacity-20 pointer-events-none"
                />

                {/* Message Content (Z-index to stay above cloud) */}
                <div className="relative z-10">
                  {/* Quoted Message (Reply Context) */}
                  {msg.metadata?.reply_to && (
                    <div className={`mb-2 p-2 rounded-xl border-l-4 text-xs bg-white/10 backdrop-blur-sm ${!isUser ? 'border-cyan-300' : 'border-purple-300'}`}>
                      <p className="font-bold mb-0.5">{msg.metadata.reply_to.role === 'user' ? 'You' : 'WinDear'}</p>
                      <p className="truncate font-serif italic">{msg.metadata.reply_to.content || 'Attachment'}</p>
                    </div>
                  )}

                  {/* Task 6: Validate ChatBubble - Ensure it reads content correctly with fallback */}
                  {msg.type === 'text' && (
                    <div className="text-[16px] leading-relaxed font-serif italic whitespace-pre-wrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                      {msg.content || msg.text || (
                        <span className="opacity-50 italic">Empty message</span>
                      )}
                      {/* Link Previews */}
                      {extractUrls(msg.content || msg.text || '').map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={`block mt-3 p-3 rounded-xl border bg-white/10 border-white/20 hover:bg-white/20 transition-all`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-white/20`}>
                              <LinkIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate text-white">Link Preview</p>
                              <p className="text-[10px] truncate text-white/70">{new URL(url).hostname}</p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                  
                  {msg.type === 'image' && (
                    <div className="relative w-full overflow-hidden rounded-xl mt-1 shadow-2xl">
                      <img 
                        src={msg.media_url || ''} 
                        alt="Attachment" 
                        className="w-full h-auto object-cover max-h-[400px]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  
                  {msg.type === 'video' && (
                    <video src={msg.media_url || ''} controls className="max-w-full rounded-xl mt-1 shadow-2xl" />
                  )}
                  
                  {msg.type === 'audio' && (
                    <audio src={msg.media_url || ''} controls className="max-w-full mt-1" />
                  )}
                  
                  {msg.type === 'location' && msg.metadata?.latitude && msg.metadata?.longitude && (
                    <div className="mt-1 rounded-xl overflow-hidden border border-white/20 bg-black/40 backdrop-blur-md">
                      <a 
                        href={`https://www.google.com/maps?q=${msg.metadata.latitude},${msg.metadata.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative group"
                      >
                        <div className="bg-white/5 h-24 flex items-center justify-center transition-colors group-hover:bg-white/10">
                          <MapPin className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="p-3 text-sm font-medium flex items-center justify-between border-t border-white/10">
                          <span className="text-white">View on Maps</span>
                          <span className="text-xs text-white/50 font-mono">
                            {msg.metadata.latitude.toFixed(4)}, {msg.metadata.longitude.toFixed(4)}
                          </span>
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                {/* Thought Bubble Tail for User */}
                {isUser && (
                  <div className="absolute -bottom-6 -right-2 flex flex-col items-end gap-1.5 pointer-events-none">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-5 h-5 bg-purple-400/60 rounded-full blur-[2px] shadow-[0_0_20px_rgba(168,85,247,0.5)]" 
                    />
                    <motion.div 
                      animate={{ scale: [1, 0.8, 1] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      className="w-3 h-3 bg-purple-500/40 rounded-full mr-1 blur-[1px]" 
                    />
                  </div>
                )}

                {/* AI Tail */}
                {!isUser && (
                  <div className="absolute -bottom-6 -left-2 flex flex-col items-start gap-1.5 pointer-events-none">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-5 h-5 bg-cyan-400/60 rounded-full blur-[2px] shadow-[0_0_20px_rgba(6,182,212,0.5)]" 
                    />
                    <motion.div 
                      animate={{ scale: [1, 0.8, 1] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      className="w-3 h-3 bg-cyan-500/40 rounded-full ml-1 blur-[1px]" 
                    />
                  </div>
                )}
              </div>
              
              {/* Timestamp placeholder or small label */}
              <div className={`flex items-center gap-1.5 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  {isUser ? 'You' : 'WinDear'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {isUser && (
                  <div className="flex items-center gap-0.5">
                    {msg.status === 'sending' && <SendingIndicator />}
                    {msg.status === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
                    {(msg.status === 'saved' || !msg.status) && (
                      <>
                        <Feather className="w-3 h-3 text-indigo-400/70" />
                        {msg.event_score && msg.event_score > 7 && (
                          <Sparkles className="w-3 h-3 text-amber-400" />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

