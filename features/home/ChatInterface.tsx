'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { ChatInput } from './ChatInput';
import { useUIStore } from '@/lib/store/use-ui-store';
import { User, Sparkles, X, Shield, Plus, MessageSquare } from 'lucide-react';
import { coreService, ChatSession } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { NudgeService } from '@/lib/services/nudge-service';
import { useChat } from '@ai-sdk/react';

export interface ChatMessage {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const result = await coreService.sendMessage({
        user_id: user.id,
        session_id: sessionId || undefined,
        type: 'text',
        content: trimmedContent,
        metadata: { language },
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
      }
    } catch (error: any) {
      console.error("Failed to sync message with backend:", error);
      
      let displayError = "Something went wrong.";
      try {
        // Try to see if it's a JSON error from Firestore/Supabase or AI
        const parsed = JSON.parse(error.message);
        displayError = parsed.error || error.message;
      } catch (e) {
        displayError = error.message || "Unknown error";
      }

      setMessages(prev => prev.map(m => 
        m.id === aiTempId ? { ...m, content: `Err: ${displayError}`, role: 'diary' } : m
      ));
    } finally {
      setIsThinking(false);
    }
  };

  const poetizeThinkingStep = (step?: string) => {
    if (!step) return "Whispering to the silence...";
    if (step.includes("Searching") || step.includes("search")) {
      return "Gathering whispers from the collective mind...";
    }
    if (step.includes("Using tool") || step.includes("Consulting")) {
      return "Consulting the infinite echoes...";
    }
    if (step === 'Thought complete.') return 'Almost there...';
    return step;
  };

  const ThinkingSkeleton = () => (
    <div className="flex flex-col gap-4 py-2 w-full min-w-[240px]">
      <div className="flex gap-2 mb-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            className="w-1 h-1 bg-indigo-400 rounded-full"
          />
        ))}
      </div>
      <div className="space-y-3">
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="h-2.5 w-full bg-white rounded-full" 
        />
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          className="h-2.5 w-[90%] bg-white rounded-full" 
        />
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="h-2.5 w-[65%] bg-white rounded-full" 
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white relative overflow-hidden font-sans">
      <AuthPromptModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Nudge / Motivation UI - Emotional Decision Point */}
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
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>

              <div className="space-y-3 mb-10">
                <h3 className="text-xl font-serif italic text-white leading-tight">
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
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-medium transition-all"
                >
                  Let&apos;s continue
                </motion.button>
                
                <button 
                  onClick={handleStartNewSession}
                  className="w-full py-3 text-white/50 hover:text-white text-xs tracking-wide uppercase font-semibold transition-all"
                >
                  Start Fresh
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

      {/* Header Inline */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent pt-6 pb-12 px-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-white/50" />
           </div>
           <div className="flex flex-col pointer-events-auto">
             <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Active Thread</span>
             <span className="text-sm font-serif italic text-white/80">{activeSession?.title || 'Reflection'}</span>
           </div>
        </div>
        <button 
          onClick={handleStartNewSession}
          className="pointer-events-auto w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group lg:mr-8"
          title="Start a new chat"
        >
          <Plus className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Messages Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto scrollbar-whatsapp ${isScrolling ? 'is-scrolling' : ''} px-4 pt-32 pb-6 transition-all duration-700`}
      >
        <div className={`max-w-2xl mx-auto space-y-8 min-h-full flex flex-col transition-all duration-700 
          ${isInputFocused ? 'opacity-30 blur-[0.5px]' : 'opacity-100'} 
          ${showNudge ? 'blur-sm scale-[0.99] opacity-40 pointer-events-none' : 'blur-0 scale-100 opacity-100'}`}
        >
          {/* Privacy Trust Signal */}
          <div className="flex flex-col items-center justify-center space-y-3 mb-10 select-none opacity-60 hover:opacity-100 transition-opacity">
             <Shield className="w-6 h-6 text-emerald-500/50 drop-shadow-md" />
             <p className="text-[11px] font-sans text-center max-w-[280px] text-emerald-100/60 drop-shadow-sm uppercase tracking-widest leading-relaxed">
                Your reflections are sealed within your unique neural resonance.
             </p>
          </div>

          <AnimatePresence mode="wait">
            {messages.length === 0 && !showNudge && (
              <motion.div 
                key="empty-suggestions"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="flex-1 flex flex-col items-center justify-center space-y-10"
              >
                <div className="flex flex-col items-center space-y-4">
                  <motion.div 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 bg-white/5 rounded-2xl rotate-3 flex items-center justify-center border border-white/10"
                  >
                     <Sparkles className="w-6 h-6 text-indigo-400" />
                  </motion.div>
                  <h2 className="text-xl md:text-2xl font-serif italic text-white/80 pb-2">What is on your mind?</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                  {starters.map((starter, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage({ type: 'text', content: starter.text })}
                      className="w-full text-left p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[13px] md:text-sm text-white/70 font-sans transition-all flex flex-col gap-3 group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform origin-bottom-left">{starter.icon}</span>
                      <span className="leading-relaxed font-medium">{starter.text}</span>
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
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className={`flex items-end max-w-[95%] md:max-w-[85%] relative ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar with Custom Cutout Effect */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-[4px] border-[#0a0a0a] z-10 box-content mb-1 ${
                    isUser 
                      ? 'bg-neutral-800 -ml-4' 
                      : 'bg-indigo-900/80 -mr-4'
                  }`}>
                    {isUser ? <User className="w-3.5 h-3.5 text-white/60" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-300" />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-full px-5 py-4 z-0 ${
                    isUser 
                      ? 'bg-[#212121] text-white rounded-[24px] shadow-md' 
                      : 'bg-white/[0.04] border border-white/5 text-white rounded-[24px] backdrop-blur-md shadow-sm'
                  }`} style={{ minWidth: '40px' }}>
                  {isThinkingMsg || (msg.role === 'diary' && !msg.content) ? (
                    <div className="flex flex-col gap-3">
                      <ThinkingSkeleton />
                      {msg.thinking_step && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[10px] uppercase tracking-[0.15em] text-indigo-300/40 font-bold"
                        >
                          {poetizeThinkingStep(msg.thinking_step)}
                        </motion.p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="text-[15px] leading-relaxed tracking-wide prose prose-invert prose-p:leading-[1.7] prose-p:last:mb-0 max-w-none text-white/90">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {msg.thinking_step && msg.thinking_step !== 'Thought complete.' && isThinking && msg.id === messages[messages.length - 1].id && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3"
                        >
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                className="w-1 h-1 bg-indigo-400 rounded-full"
                              />
                            ))}
                          </div>
                          <span className="text-[9px] uppercase tracking-[0.1em] text-indigo-300/40 font-bold">{poetizeThinkingStep(msg.thinking_step)}</span>
                        </motion.div>
                      )}
                      
                      {/* Processing Status Indicator */}
                      {msg.role === 'diary' && msg.processing_status && msg.processing_status !== 'observed' && (
                        <div className={`mt-3 pt-3 border-t border-white/10 text-[9px] uppercase tracking-[0.2em] font-bold flex items-center gap-1.5 opacity-60 ${
                          msg.processing_status === 'woven' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          <Sparkles className="w-2.5 h-2.5" />
                          {msg.processing_status === 'woven' ? 'Narrative Woven' : 'Moment Saved'}
                        </div>
                      )}
                    </>
                  )}
                </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Input Section */}
      <div className={`shrink-0 w-full z-50 px-4 pt-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent transition-all duration-300 ${isInputFocused ? 'pb-[env(safe-area-inset-bottom)]' : 'pb-[calc(64px+env(safe-area-inset-bottom))]'}`}>
        <div className={`pb-4 max-w-3xl mx-auto transition-all duration-500 ${isInputFocused ? 'pb-6' : ''}`}>
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

