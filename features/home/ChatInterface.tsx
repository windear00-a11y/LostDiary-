'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatInput } from './ChatInput';
import { generateStoryResponse } from '@/ai-core/ai-engine';
import { useUIStore } from '@/lib/store/use-ui-store';
import { User, Sparkles, X, Heart, Shield, Book } from 'lucide-react';
import { coreService, ChatSession } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'diary';
  content: string;
  created_at: string;
  processing_status?: 'woven' | 'saved' | 'observed' | 'pending';
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const [hasShownNudge, setHasShownNudge] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setInputFocused, isInputFocused, language } = useUIStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1500);
  };

  // Fetch or find session on mount
  useEffect(() => {
    const initializeSession = async () => {
      const user = await authService.getUser();
      if (!user) return;

      try {
        let targetSessionId = sessionId;

        // 1. If no session in URL, find the latest one
        if (!targetSessionId) {
          const sessions = await coreService.fetchSessions(user.id);
          if (sessions.length > 0) {
            targetSessionId = sessions[0].id;
            // Update URL silently or just set state
            router.replace(`/home?session=${targetSessionId}`);
            return; // Effect will re-run with updated sessionId
          } else {
            // No sessions at all? Create a default one
            const newSession = await coreService.createSession(user.id, "First entry");
            targetSessionId = newSession.id;
            router.replace(`/home?session=${targetSessionId}`);
            return; // Effect will re-run
          }
        }

        // 2. Load messages for the determined session
        if (targetSessionId) {
          const history = await coreService.fetchMessages(user.id, targetSessionId);
          const mappedMessages: ChatMessage[] = history.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'diary',
            content: m.content || "",
            created_at: m.created_at,
            processing_status: m.processing_status
          }));
          setMessages(mappedMessages);

          // 3. Check for inactivity nudge (2 hours) - only if we haven't shown it this mount
          if (!hasShownNudge) {
            if (mappedMessages.length > 0) {
              const lastMsg = mappedMessages[mappedMessages.length - 1];
              const lastTime = new Date(lastMsg.created_at).getTime();
              const now = new Date().getTime();
              const hoursPassed = (now - lastTime) / (1000 * 60 * 60);

              if (hoursPassed > 2) {
                setShowNudge(true);
                setHasShownNudge(true);
              }
            } else {
              // Empty session, show greeting
              setShowNudge(true);
              setHasShownNudge(true);
            }
          }
        }
      } catch (error) {
        console.error("Session initialization failed:", error);
      }
    };

    initializeSession();
  }, [sessionId, router]);

  const starters = [
    { text: "Aaj mera dimag thoda uljha hai, clarity chahiye.", icon: "🧠" },
    { text: "Mujhe ek decision lena hai, kya tum sunoge?", icon: "⚖️" },
    { text: "Main aaj thoda low hoon, let's talk.", icon: "🤝" },
    { text: "Mujhe meri hi kisi purani growth ki yaad dilao.", icon: "🌱" },
    { text: "Aaj ka din 3 anokhe shabdon mein batao?", icon: "🎭" },
  ];

  const handleStartNewSession = async () => {
    const user = await authService.getUser();
    if (!user) return;
    
    try {
      const newSession = await coreService.createSession(user.id, `Moment ${new Date().toLocaleDateString()}`);
      router.push(`/home?session=${newSession.id}`);
      setShowNudge(false);
      setMessages([]);
      // This will trigger the empty state view with starters
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendMessage = async (input: { type: 'text'; content: string }) => {
    const trimmedContent = input.content.trim();
    if (!trimmedContent || isThinking) return;

    const user = await authService.getUser();
    
    // Guest Quota: Limit to 3 messages
    if (!user) {
       const guestCount = parseInt(localStorage.getItem('guest_msg_count') || '0');
       if (guestCount >= 3) {
         setShowAuthModal(true);
         return;
       }
       localStorage.setItem('guest_msg_count', (guestCount + 1).toString());
    }

    // Auto-hide nudge and starters when active conversation begins
    setShowNudge(false);

    // 1. Optimistic Update (Show user message instantly)
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedContent,
      created_at: new Date().toISOString(),
    };

    const aiTempId = `temp-${Date.now()}`;
    const aiTempMsg: ChatMessage = {
      id: aiTempId,
      role: 'ai',
      content: 'Thinking...',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg, aiTempMsg]);
    setIsThinking(true);

    try {
      // 2. Persistent Backend Call
      const result = await coreService.sendMessage({
        user_id: user.id,
        session_id: sessionId || undefined,
        type: 'text',
        content: trimmedContent,
        metadata: { language }
      });

      // 3. Update messages using the direct response from API
      if (result.aiResponse) {
        setMessages(prev => prev.map(m => 
          m.id === aiTempId ? { 
            ...m, 
            id: `ai-${Date.now()}`, 
            content: result.aiResponse.content, 
            role: 'diary' 
          } : m
        ));
      } else {
        setMessages(prev => prev.map(m => 
          m.id === aiTempId ? { ...m, content: "I've saved that for you. Tell me more when you're ready.", role: 'diary' } : m
        ));
      }
    } catch (error: any) {
      console.error("Failed to sync message with backend:", error);
      const errorMsg = error.message?.includes('API Key') 
        ? "AI configuration missing. Please check your API keys."
        : "Connection pause. Your memory is safe, but I couldn't reflect right now.";
        
      setMessages(prev => prev.map(m => 
        m.id === aiTempId ? { ...m, content: errorMsg, role: 'diary' } : m
      ));
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white relative overflow-hidden font-sans">
      <AuthPromptModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Nudge / Motivation UI - Emotional Decision Point (Moved outside blurred container) */}
      <AnimatePresence>
        {showNudge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neutral-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="bg-neutral-900/80 border border-white/10 rounded-[32px] p-8 text-center max-w-sm w-full shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>

              <div className="space-y-3 mb-10">
                <h3 className="text-2xl font-serif italic text-white leading-tight">
                  {messages.length === 0 ? "Aapki baaton ka intezar hai." : "Main kab se sunne ke liye rukka tha."}
                </h3>
                <p className="text-sm text-slate-400 font-serif leading-relaxed px-4">
                  {messages.length === 0 
                    ? "Koi aisi baat jo aap kehna chahte hon? Main yahan hoon." 
                    : "Humari pichli baat mujhe yaad hai. Kya wahin se aage badhein ya koi nayi baatchit shuru karein?"}
                </p>
              </div>

              <div className="space-y-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNudge(false)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-medium shadow-[0_10px_20px_rgba(79,70,229,0.3)] transition-all"
                >
                  Haan, wahin se aage badhte hain
                </motion.button>
                
                <button 
                  onClick={handleStartNewSession}
                  className="w-full py-3 text-white/60 hover:text-white text-xs font-medium transition-all"
                >
                  Nayi baatchit shuru karein
                </button>
              </div>

              <button 
                onClick={() => setShowNudge(false)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Gradient Mask for smooth scrolling transition */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-neutral-950 via-neutral-950/90 to-transparent z-40 pointer-events-none" />

      {/* Messages Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto scrollbar-whatsapp ${isScrolling ? 'is-scrolling' : ''} px-4 pt-40 pb-20 transition-all duration-700`}
      >
        <div className={`max-w-2xl mx-auto space-y-8 min-h-full flex flex-col pt-10 transition-all duration-700 
          ${isInputFocused ? 'opacity-30 blur-[0.5px]' : 'opacity-100'} 
          ${showNudge ? 'blur-sm scale-[0.99] opacity-40 pointer-events-none' : 'blur-0 scale-100 opacity-100'}`}
        >
          {/* Privacy Trust Signal */}
          <div className="flex flex-col items-center justify-center space-y-2 mb-4 opacity-80 select-none">
             <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-50">End-to-End Soul Privacy</span>
             </div>
             <p className="text-[10px] font-serif italic text-center max-w-[250px] text-emerald-100/70">
                Your reflections are sealed within your unique neural resonance. WinDear never logs human-readable data.
             </p>
          </div>

          <AnimatePresence mode="wait">
            {messages.length === 0 && !showNudge && (
              <motion.div 
                key="empty-suggestions"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 0.6, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="flex-1 flex flex-col items-center justify-center space-y-8"
              >
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center"
                >
                   <Sparkles className="w-8 h-8 text-white/20" />
                </motion.div>
                <h2 className="text-xl font-serif italic text-white/80">Silence is a blank page...</h2>
                <div className="flex flex-wrap items-center justify-center gap-3 max-w-sm">
                  {starters.map((starter, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSendMessage({ type: 'text', content: starter.text })}
                      className="px-4 py-2 bg-neutral-800/60 border border-white/20 rounded-full text-sm text-white/90 transition-all hover:text-white hover:bg-neutral-700/80 shadow-sm"
                    >
                      {starter.icon} {starter.text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isThinkingMsg = msg.content === 'Thinking...';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                  isUser 
                    ? 'bg-neutral-800 border-white/10' 
                    : 'bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5'
                }`}>
                  {isUser ? <User className="w-4 h-4 text-white/50" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl ${
                  isUser 
                    ? 'bg-white text-black rounded-tr-none shadow-xl' 
                    : 'bg-[#151515] border border-white/20 text-white drop-shadow-md rounded-tl-none shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
                }`}>
                  {isThinkingMsg ? (
                    <div className="flex gap-1 py-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 bg-white/40 rounded-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm md:text-base leading-relaxed tracking-wide whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Input Section */}
      <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-[env(safe-area-inset-bottom)] bg-neutral-950/90 backdrop-blur-md border-t border-white/5">
        <div className="text-center pb-2">
            <p className="text-xs text-white/60 italic font-serif group cursor-default hover:text-white/90 transition-colors">AI processing is transient & ephemeral for your privacy.</p>
        </div>
        <div className={`pt-2 pb-6 max-w-3xl mx-auto transition-all duration-500 ${isInputFocused ? 'pb-8 scale-[1.01]' : 'pb-4'}`}>
          <ChatInput 
            onSendMessage={handleSendMessage} 
            disabled={isThinking} 
            onFocusChange={setInputFocused}
          />
        </div>
      </div>
    </div>
  );
};
