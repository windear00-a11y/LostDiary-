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

              <div className={`relative px-6 py-4 transition-all duration-700 ${
                isUser 
                  ? 'text-white' 
                  : 'text-white'
              }`}
              style={isUser ? {
                borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%',
              } : {
                borderRadius: '60% 40% 40% 60% / 40% 60% 60% 40%',
              }}>
                {/* Realistic Cloud Background Layers */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-visible">
                  {/* Main Glow Layer */}
                  <div className={`absolute inset-0 blur-2xl opacity-60 ${
                    isUser ? 'bg-purple-600' : 'bg-cyan-500'
                  }`} />
                  
                  {/* Textured Puffs */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.05, 0.95, 1],
                      rotate: [0, 1, -1, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute -inset-2 blur-xl opacity-40 rounded-full ${
                      isUser ? 'bg-fuchsia-500' : 'bg-blue-400'
                    }`} 
                  />
                  
                  <motion.div 
                    animate={{ 
                      scale: [1, 0.95, 1.05, 1],
                      x: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className={`absolute -inset-4 blur-3xl opacity-30 rounded-full ${
                      isUser ? 'bg-indigo-600' : 'bg-cyan-600'
                    }`} 
                  />

                  {/* Inner Core */}
                  <div className={`absolute inset-0 backdrop-blur-md border border-white/10 ${
                    isUser 
                      ? 'bg-purple-600/80 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]' 
                      : 'bg-cyan-600/80 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]'
                  }`} 
                  style={isUser ? {
                    borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%',
                  } : {
                    borderRadius: '60% 40% 40% 60% / 40% 60% 60% 40%',
                  }} />
                </div>
                
                {/* Cloud Bumps (Visual fluff) */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div className={`absolute -top-3 ${isUser ? 'right-1/4' : 'left-1/4'} w-10 h-10 blur-md rounded-full ${isUser ? 'bg-purple-500/40' : 'bg-cyan-400/40'}`} />
                  <div className={`absolute -bottom-2 ${isUser ? 'left-1/3' : 'right-1/3'} w-8 h-8 blur-sm rounded-full ${isUser ? 'bg-fuchsia-600/30' : 'bg-blue-500/30'}`} />
                </div>

                {/* Message Content (Z-index to stay above cloud) */}
                <div className="relative z-10">
                  {/* Quoted Message (Reply Context) */}
                  {msg.metadata?.reply_to && (
                    <div className={`mb-2 p-2 rounded-xl border-l-4 text-xs opacity-80 ${isUser ? 'bg-purple-900/40 border-purple-300' : 'bg-cyan-900/40 border-cyan-300'}`}>
                      <p className="font-bold mb-0.5">{msg.metadata.reply_to.role === 'user' ? 'You' : 'WinDear'}</p>
                      <p className="truncate font-serif italic">{msg.metadata.reply_to.content || 'Attachment'}</p>
                    </div>
                  )}

                  {/* Task 6: Validate ChatBubble - Ensure it reads content correctly with fallback */}
                  {msg.type === 'text' && (
                    <div className="text-[15px] leading-relaxed font-serif italic whitespace-pre-wrap drop-shadow-sm">
                      {msg.content || msg.text || (
                        <span className="opacity-50 italic">Empty message</span>
                      )}
                      {/* Link Previews */}
                      {extractUrls(msg.content || msg.text || '').map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={`block mt-3 p-3 rounded-xl border ${isUser ? 'bg-purple-700/30 border-purple-400/30' : 'bg-cyan-700/30 border-cyan-400/30'} hover:opacity-80 transition-opacity`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-purple-500/50' : 'bg-cyan-500/50'}`}>
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
                  
                  {msg.type === 'location' && msg.metadata?.latitude && msg.metadata?.longitude && (
                    <div className="mt-1 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                      <a 
                        href={`https://www.google.com/maps?q=${msg.metadata.latitude},${msg.metadata.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative group"
                      >
                        <div className="bg-white/5 h-24 flex items-center justify-center transition-colors group-hover:bg-white/10">
                          <MapPin className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="p-3 text-sm font-medium flex items-center justify-between border-t border-white/5">
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
                  <div className="absolute -bottom-4 -right-1 flex flex-col items-end gap-1 pointer-events-none">
                    <div className="w-4 h-4 bg-purple-500/80 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
                    <div className="w-2.5 h-2.5 bg-purple-600/60 rounded-full mr-1 shadow-[0_0_8px_rgba(168,85,247,0.3)]" />
                  </div>
                )}

                {/* AI Tail (Optional, for symmetry) */}
                {!isUser && (
                  <div className="absolute -bottom-4 -left-1 flex flex-col items-start gap-1 pointer-events-none">
                    <div className="w-4 h-4 bg-cyan-500/80 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
                    <div className="w-2.5 h-2.5 bg-cyan-600/60 rounded-full ml-1 shadow-[0_0_8px_rgba(6,182,212,0.3)]" />
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

