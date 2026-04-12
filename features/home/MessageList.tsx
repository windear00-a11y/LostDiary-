'use client';

import { ChatMessage } from '@/lib/services/chat-service';
import { MapPin, User, Sparkles, Reply, Feather, Link as LinkIcon } from 'lucide-react';
import { motion } from 'motion/react';

// Helper to extract URLs from text
const extractUrls = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];
  return urls;
};

export const MessageList = ({ messages, onReply }: { messages: ChatMessage[], onReply?: (msg: ChatMessage) => void }) => {
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

              <div className={`relative px-5 py-3.5 shadow-sm border ${
                isUser 
                  ? 'bg-indigo-600 border-indigo-500 text-white rounded-t-[24px] rounded-bl-[24px] rounded-br-[4px]' 
                  : 'bg-white dark:bg-[#1A1A1D] border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-t-[24px] rounded-br-[24px] rounded-bl-[4px]'
              }`}>
                
                {/* Quoted Message (Reply Context) */}
                {msg.metadata?.reply_to && (
                  <div className={`mb-2 p-2 rounded-xl border-l-4 text-xs opacity-80 ${isUser ? 'bg-indigo-700/50 border-indigo-300' : 'bg-gray-100 dark:bg-gray-800 border-indigo-500'}`}>
                    <p className="font-bold mb-0.5">{msg.metadata.reply_to.role === 'user' ? 'You' : 'WinDear'}</p>
                    <p className="truncate font-serif italic">{msg.metadata.reply_to.content || 'Attachment'}</p>
                  </div>
                )}

                {msg.type === 'text' && (
                  <div className="text-[15px] leading-relaxed font-serif italic whitespace-pre-wrap">
                    {msg.content}
                    {/* Link Previews */}
                    {extractUrls(msg.content || '').map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={`block mt-3 p-3 rounded-xl border ${isUser ? 'bg-indigo-700/30 border-indigo-400/30' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'} hover:opacity-80 transition-opacity`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-500/50' : 'bg-white dark:bg-gray-700 shadow-sm'}`}>
                            <LinkIcon className={`w-5 h-5 ${isUser ? 'text-white' : 'text-indigo-500'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${isUser ? 'text-indigo-100' : 'text-gray-900 dark:text-gray-100'}`}>Link Preview</p>
                            <p className={`text-[10px] truncate ${isUser ? 'text-indigo-200' : 'text-gray-500'}`}>{new URL(url).hostname}</p>
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
                  <div className="mt-1 rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1A1A1D]">
                    <a 
                      href={`https://www.google.com/maps?q=${msg.metadata.latitude},${msg.metadata.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative group"
                    >
                      <div className="bg-gray-50 dark:bg-gray-800/50 h-24 flex items-center justify-center transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-800">
                        <MapPin className="w-8 h-8 text-rose-500" />
                      </div>
                      <div className="p-3 text-sm font-medium flex items-center justify-between border-t border-gray-100 dark:border-white/5">
                        <span className="text-gray-800 dark:text-gray-200">View on Maps</span>
                        <span className="text-xs text-gray-400 font-mono">
                          {msg.metadata.latitude.toFixed(4)}, {msg.metadata.longitude.toFixed(4)}
                        </span>
                      </div>
                    </a>
                  </div>
                )}
              </div>
              
              {/* Timestamp placeholder or small label */}
              <div className={`flex items-center gap-1.5 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  {isUser ? 'You' : 'WinDear'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {isUser && (
                  msg.event_score && msg.event_score > 0 ? (
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                  ) : (
                    <Feather className="w-3 h-3 text-indigo-400/70" />
                  )
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

