'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { ChatInput } from './ChatInput';
import { useUIStore } from '@/lib/store/use-ui-store';
import { ThinkingIndicator } from '@/components/ui/ThinkingIndicator';
import { User, Sparkles, X, Shield, Plus, MessageSquare } from 'lucide-react';
import { coreService, ChatSession } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { getSupabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { NudgeService } from '@/lib/services/nudge-service';
import { useChat } from '@ai-sdk/react';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'diary';
  content: string;
  created_at: string;
  processing_status?: 'woven' | 'saved' | 'observed' | 'pending';
  thinking_step?: string;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { 
    setInputFocused, 
    isInputFocused, 
    language,
    chatPersonaMode,
    isBrutalHonestyOn
  } = useUIStore();
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

        if (targetSessionId === 'new') {
           const newSession = await coreService.createSession(user.id, "New whisper");
           router.replace(`/home?session=${newSession.id}`);
           return;
        }

        if (!targetSessionId) {
          const sessions = await coreService.fetchSessions(user.id);
          if (sessions.length > 0) {
            targetSessionId = sessions[0].id;
            router.replace(`/home?session=${targetSessionId}`);
            return; 
          } else {
            const newSession = await coreService.createSession(user.id, "First entry");
            targetSessionId = newSession.id;
            router.replace(`/home?session=${targetSessionId}`);
            return; 
          }
        }

        if (targetSessionId) {
          // Fetch current session title
          const sessions = await coreService.fetchSessions(user.id);
          const current = sessions.find(s => s.id === targetSessionId);
          if (current) setActiveSession(current);

          const history = await coreService.fetchMessages(user.id, targetSessionId);
          const mappedMessages: ChatMessage[] = history.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'diary',
            content: m.content || "",
            created_at: m.created_at,
            processing_status: m.processing_status
          }));
          setMessages(mappedMessages);

          if (NudgeService.shouldShowNudge('chat', 2)) {
            setShowNudge(true);
            NudgeService.markNudgeShown('chat');
          }
        }
      } catch (error) {
        console.error("Session initialization failed:", error);
      }
    };

    initializeSession();
  }, [sessionId, router]);

  const starters = [
    { text: "My mind feels a bit tangled, I need clarity.", icon: "💭" },
    { text: "I have a decision to make, will you listen?", icon: "⚖️" },
    { text: "I'm feeling a little low today, let's talk.", icon: "🌿" },
    { text: "Remind me of a moment I showed growth.", icon: "🌱" },
  ];

  const handleStartNewSession = async () => {
    const user = await authService.getUser();
    if (!user) return;
    
    try {
      const newSession = await coreService.createSession(user.id, `Moment ${new Date().toLocaleDateString()}`);
      router.push(`/home?session=${newSession.id}`);
      setShowNudge(false);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      if (smooth) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  };

  const lastMessageContent = messages.length > 0 ? messages[messages.length - 1].content : undefined;

  // Scroll to bottom immediately when new messages arrive, or when thinking state changes
  useEffect(() => {
    // If thinking is true, it's starting to type or stream. Use instant to prevent jitter
    scrollToBottom(!isThinking);
  }, [messages.length, lastMessageContent, isThinking]);

  const handleSendMessage = async (input: { type: 'text'; content: string }) => {
    const trimmedContent = input.content.trim();
    if (!trimmedContent || isThinking) return;

    const user = await authService.getUser();
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setShowNudge(false);

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
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await coreService.sendMessage({
        user_id: user.id,
        session_id: sessionId || undefined,
        type: 'text',
        content: trimmedContent,
        metadata: { 
          language, 
          timezone,
          personaMode: chatPersonaMode,
          brutalHonesty: isBrutalHonestyOn
        },
        onUpdate: (streamedText, thinkingStep) => {
          setMessages(prev => prev.map(m => 
            m.id === aiTempId ? { 
              ...m, 
              content: streamedText, 
              role: 'diary',
              thinking_step: thinkingStep
            } : m
          ));
        }
      });

      if (result) {
        setMessages(prev => prev.map(m => 
          m.id === aiTempId ? { 
            ...m, 
            content: result.content || "My mind was cloudy just then... Could you tell me again?", 
            role: result.role || 'diary',
            processing_status: result.processing_status
          } : m
        ));
        
        // Wait for the background AI extraction Pipeline to finish!
        // We poll the 'chat_sessions' table up to 6 times to accurately trigger 
        // the Memory Wave portal animation ONLY when an Event or Chapter is created!
        const currentSessionId = result.session_id || sessionId;
        if (currentSessionId && currentSessionId !== 'new' && currentSessionId !== sessionId) {
          router.replace(`/home?session=${currentSessionId}`);
        }
        if (currentSessionId && currentSessionId !== 'new') {
          const supabase = getSupabase();
          if (supabase) {
            let attempts = 0;
            const checkStatus = async () => {
              if (attempts > 6) return; // give up after ~12s
              attempts++;
              const { data } = await supabase.from('chat_sessions')
                .select('processing_status').eq('id', currentSessionId).single();
              
              if (data && (data.processing_status === 'woven' || data.processing_status === 'saved')) {
                // Update final UI message state
                setMessages(prev => prev.map(m => 
                  m.id === aiTempId ? { ...m, processing_status: data.processing_status } : m
                ));
                // Fire the portal integration animation!
                useUIStore.getState().triggerMemorySync();
              } else if (data && data.processing_status === 'observed') {
                // Just an observation, no visual wave needed!
                return;
              } else {
                setTimeout(checkStatus, 2000);
              }
            };
            setTimeout(checkStatus, 2000);
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to sync message with backend:", error);
      
      let displayError = "Something went wrong.";
      let statusCode = "";
      
      try {
        // Try to parse the enhanced error JSON from coreService
        const parsed = JSON.parse(error.message);
        if (parsed.error) {
          displayError = parsed.error;
          if (parsed.status) statusCode = ` (${parsed.status})`;
        } else {
          displayError = error.message;
        }
      } catch (e) {
        displayError = error.message || "Unknown error";
      }

      setMessages(prev => prev.map(m => 
        m.id === aiTempId ? { 
          ...m, 
          content: `Err: ${displayError}${statusCode}`, 
          role: 'diary' 
        } : m
      ));
    } finally {
      setIsThinking(false);
    }
  };

  const getThemeBackground = () => {
    if (isBrutalHonestyOn) {
      return 'radial-gradient(circle at 50% 0%, rgba(225, 29, 72, 0.15) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(225, 29, 72, 0.05) 0%, transparent 50%)';
    }
    return chatPersonaMode === 'mirror' 
      ? 'radial-gradient(circle at 50% 0%, var(--color-accent-glow) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(255, 158, 94, 0.05) 0%, transparent 50%)' 
      : 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)';
  };

  const getThemeColorClass = () => {
    if (isBrutalHonestyOn) return 'text-rose-500';
    return chatPersonaMode === 'mirror' ? 'text-[var(--color-accent-amber)]' : 'text-emerald-500';
  };

  const getThemeBgClass10 = () => {
    if (isBrutalHonestyOn) return 'bg-rose-500/10';
    return chatPersonaMode === 'mirror' ? 'bg-[var(--color-accent-amber)]/10' : 'bg-emerald-500/10';
  };

  const getThemeBgClass20 = () => {
    if (isBrutalHonestyOn) return 'bg-rose-500/20';
    return chatPersonaMode === 'mirror' ? 'bg-[var(--color-accent-amber)]/20' : 'bg-emerald-500/20';
  };
  
  const getThemeShadowClass = () => {
     if (isBrutalHonestyOn) return 'shadow-[0_0_40px_rgba(225,29,72,0.05)]';
     return chatPersonaMode === 'mirror' ? 'shadow-[0_0_40px_rgba(255,158,94,0.05)]' : 'shadow-[0_0_40px_rgba(16,185,129,0.05)]';
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-[var(--color-primary-text-dark)] relative overflow-hidden font-sans">
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out opacity-70 blur-[80px]"
        style={{ background: getThemeBackground() }}
      />
      <AuthPromptModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Nudge / Motivation UI - Emotional Decision Point */}
      <AnimatePresence>
        {showNudge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neutral-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="glass-surface border border-white/5 rounded-[40px] p-10 text-center max-w-sm w-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000 ${getThemeBgClass10()}`} />
              
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <div className={`absolute inset-0 blur-md rounded-full transition-colors duration-1000 ${getThemeBgClass20()}`} />
                <Sparkles className={`w-8 h-8 relative z-10 transition-colors duration-1000 ${getThemeColorClass()}`} />
              </div>

              <div className="space-y-4 mb-10">
                <h3 className="text-2xl font-serif text-[var(--color-primary-text-dark)] leading-tight">
                  {messages.length === 0 ? "Aapki baaton ka intezar hai." : "Main kab se sunne ke liye rukka tha."}
                </h3>
                <p className="text-[15px] text-[var(--color-secondary-text-dark)] leading-relaxed px-2 font-serif italic">
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
                  className="w-full py-4 bg-[var(--color-primary-text-dark)] text-[var(--color-primary-text-light)] rounded-2xl font-medium transition-all shadow-[0_0_20px_rgba(232,226,217,0.1)] focus:outline-none"
                >
                  Let&apos;s continue
                </motion.button>
                
                <button 
                  onClick={handleStartNewSession}
                  className="w-full py-3 text-[var(--color-secondary-text-dark)] hover:text-[var(--color-primary-text-dark)] text-xs tracking-widest uppercase font-semibold transition-all focus:outline-none"
                >
                  Start Fresh
                </button>
              </div>

              <button 
                onClick={() => setShowNudge(false)}
                className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence> 

      {/* Top padding to accommodate global header */}
      <div className="h-20 shrink-0" />

      {/* Messages Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto scrollbar-whatsapp ${isScrolling ? 'is-scrolling' : ''} px-4 pt-4 pb-6 transition-all duration-700 relative z-10`}
      >
        <div className={`max-w-2xl mx-auto space-y-12 min-h-full flex flex-col transition-all duration-700 
          ${isInputFocused ? 'opacity-40 blur-[1px]' : 'opacity-100'} 
          ${showNudge ? 'blur-md scale-[0.98] opacity-30 pointer-events-none' : 'blur-0 scale-100 opacity-100'}`}
        >
         {/* Privacy Trust Signal */}
         <div className="flex flex-col items-center justify-center space-y-4 mb-12 select-none opacity-50 hover:opacity-100 transition-opacity duration-1000">
             <Shield className="w-6 h-6 text-[#7a7266] drop-shadow-md" />
             <p className="text-[10px] font-sans text-center max-w-[280px] text-[#7a7266] uppercase tracking-[0.2em] leading-relaxed">
                Your reflections remain uniquely yours.
             </p>
         </div>

          <AnimatePresence mode="wait">
            {messages.length === 0 && !showNudge && (
              <motion.div 
                key="empty-suggestions"
                initial={{ opacity: 0, scale: 0.98, filter: "blur(5px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="flex-1 flex flex-col items-center justify-center space-y-12"
              >
                <div className="flex flex-col items-center space-y-6">
                  <motion.div 
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5 transition-shadow duration-1000 ${getThemeShadowClass()}`}
                  >
                     <Sparkles className={`w-8 h-8 opacity-80 transition-colors duration-1000 ${getThemeColorClass()}`} />
                  </motion.div>
                  <h2 className="text-3xl font-serif text-[var(--color-primary-text-dark)] tracking-wide">What is on your mind?</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                  {starters.map((starter, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage({ type: 'text', content: starter.text })}
                      className="w-full text-left p-6 glass-surface rounded-[24px] text-sm text-[var(--color-primary-text-dark)] transition-all flex flex-col gap-4 group focus:outline-none"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform origin-bottom-left grayscale group-hover:grayscale-0 opacity-80">{starter.icon}</span>
                      <span className="leading-relaxed font-serif italic text-lg tracking-wide opacity-90">{starter.text}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isThinkingMsg = msg.role === 'ai' && msg.content === 'Thinking...';

            return (
              <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className={`flex items-end max-w-[90%] md:max-w-[80%] relative ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Bubble */}
                  <div className={`max-w-full px-7 py-6 z-0 ${
                    isUser 
                      ? 'bubble-user text-[var(--color-primary-text-dark)] rounded-[32px] rounded-br-[8px]' 
                      : 'bubble-ai text-[var(--color-primary-text-dark)] rounded-[32px] rounded-bl-[8px]'
                  }`} style={{ minWidth: isThinkingMsg ? '200px' : '60px' }}>
                  {isThinkingMsg || (msg.role === 'diary' && !msg.content) ? (
                    <div className="flex flex-col gap-3">
                      <ThinkingIndicator step={msg.thinking_step} />
                    </div>
                  ) : (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <div className="prose-sanctuary">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {msg.thinking_step && msg.thinking_step !== 'Thought complete.' && isThinking && msg.id === messages[messages.length - 1].id && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4 pt-4 border-t border-white/5"
                        >
                          <ThinkingIndicator step={msg.thinking_step} layout="horizontal" />
                        </motion.div>
                      )}
                      
                      {/* Processing Status Indicator */}
                      {msg.role === 'diary' && msg.processing_status && msg.processing_status !== 'observed' && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className={`text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 opacity-60 ${
                            msg.processing_status === 'woven' ? 'text-[var(--color-accent-gold)]' : 'text-[#859587]'
                          }`}>
                            <Sparkles className="w-3 h-3" />
                            {msg.processing_status === 'woven' ? 'Narrative Woven' : 'Moment Saved'}
                          </div>
                          <span className="text-[10px] font-sans opacity-30 tracking-widest uppercase">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Input Section */}
      <div className={`shrink-0 w-full z-50 px-4 pt-8 bg-gradient-to-t from-[var(--color-bg-dark)] via-[var(--color-bg-dark)]/95 to-transparent transition-all duration-300 ${isInputFocused ? 'pb-[env(safe-area-inset-bottom)]' : 'pb-[calc(40px+env(safe-area-inset-bottom))]'}`}>
        <div className={`pb-6 max-w-3xl mx-auto transition-all duration-500`}>
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

