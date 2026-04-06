'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { WinDearAssistant } from '@/components/diary/WinDearAssistant';
import { AIUsageDashboard } from '@/components/diary/AIUsageDashboard';
import { useResourceUsage } from '@/hooks/use-resource-usage';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeft, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

export default function AssistantPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { aiCalls, entryCount, trackAICall } = useResourceUsage();
  
  const [entries, setEntries] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [persona, setPersona] = useState({ tone: 'empathetic', useEmojis: true });
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // Hidden by default on mobile

  const supabase = createClient();

  const fetchMessages = useCallback(async (sessionId: string) => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [supabase, user]);

  const fetchSessions = useCallback(async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
      if (data && data.length > 0) {
        setCurrentSessionId(data[0].id);
        fetchMessages(data[0].id);
      } else {
        // Create new session if none
        const { data: newSession, error: newError } = await supabase
          .from('chat_sessions')
          .insert({ user_id: user.id, title: 'New Chat' })
          .select()
          .single();
        if (newError) throw newError;
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  }, [supabase, user, fetchMessages]);

  const fetchEntries = useCallback(async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching entries:', err);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchSessions();
    }
  }, [user, fetchEntries, fetchSessions]);

  const handleAssistantMessage = async (message: string) => {
    if (!supabase || !user || !currentSessionId) return null;
    setIsAssistantLoading(true);
    try {
      // Strip persona instructions from the message
      const cleanMessage = message.split('\n\n[Persona:')[0];
      const personaMatch = message.match(/\[Persona: Tone=(.*), UseEmojis=(.*)\]/);
      const persona = personaMatch ? { tone: personaMatch[1], useEmojis: personaMatch[2] === 'true' } : { tone: 'empathetic', useEmojis: true };

      // Save user message
      const { data: userMsg, error: userError } = await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'user',
        content: cleanMessage
      }).select().single();
      if (userError) throw userError;
      setMessages(prev => [...prev, userMsg]);

      trackAICall();
      const { classifyIntent, handleChat } = await import('@/lib/ai');
      let intent = await classifyIntent(cleanMessage);
      const chatIntent: 'recall' | 'analysis' | 'chat' = intent === 'entry' ? 'chat' : intent;
      
      const response = await handleChat(
        cleanMessage, 
        entries, 
        i18n.resolvedLanguage || i18n.language || 'en', 
        chatIntent,
        persona // Pass persona to handleChat
      );

      // Save assistant message
      const { data: assistantMsg, error: assistantError } = await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: response
      }).select().single();
      if (assistantError) throw assistantError;
      setMessages(prev => [...prev, assistantMsg]);

      return response;
    } catch (err) {
      console.error('Assistant error:', err);
      return "I'm sorry, I'm having trouble connecting to my soul right now. Please try again later.";
    } finally {
      setIsAssistantLoading(false);
    }
  };

  return (
    <AppLayout hideFAB>
      <div className="flex h-[calc(100vh-80px)] gap-4 sm:gap-6 relative">
        {/* Mobile Overlay */}
        {showHistory && (
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-20 md:hidden"
            onClick={() => setShowHistory(false)}
          />
        )}

        {/* Sidebar for Chat History */}
        <div className={`absolute md:relative z-30 h-full bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-[#2E2E2E] p-4 flex flex-col gap-4 transition-all duration-300 ${showHistory ? 'translate-x-0 w-64 shadow-2xl md:shadow-none' : '-translate-x-[120%] md:translate-x-0 md:w-16'}`}>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between text-sm font-bold text-gray-900 dark:text-white px-2"
          >
            {showHistory && <span>Chat History</span>}
            {showHistory ? <ChevronLeft className="w-4 h-4 hidden md:block" /> : <ChevronRight className="w-4 h-4 hidden md:block" />}
            {showHistory && <X className="w-4 h-4 md:hidden" onClick={() => setShowHistory(false)} />}
          </button>
          
          {showHistory && (
            <>
              <div className="flex-1 overflow-y-auto space-y-2">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      fetchMessages(session.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-colors ${
                      currentSessionId === session.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#262626]'
                    }`}
                  >
                    {session.title}
                  </button>
                ))}
              </div>
              <button
                onClick={async () => {
                  const { data: newSession, error } = await supabase
                    .from('chat_sessions')
                    .insert({ user_id: user?.id, title: 'New Chat' })
                    .select()
                    .single();
                  if (!error) {
                    setSessions([newSession, ...sessions]);
                    setCurrentSessionId(newSession.id);
                    setMessages([]);
                  }
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                New Chat
              </button>
            </>
          )}
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 w-full max-w-4xl flex flex-col h-full pb-4">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="space-y-1 flex flex-col">
              <div className="flex items-center justify-between w-full sm:w-auto mb-2">
                <button 
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button 
                  onClick={() => setShowHistory(true)}
                  className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F9FAFB] tracking-tight">
                  Understand your thoughts.
                </h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                Write freely. Get instant AI insights about your emotions, patterns, and clarity.
              </p>
            </div>

            <div className="w-full sm:w-64">
              {/* Collapsible Settings Menu */}
              <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm overflow-hidden">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full p-3 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors"
                >
                  <span>Assistant Settings</span>
                  {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                
                {showSettings && (
                  <div className="p-4 border-t border-gray-100 dark:border-[#2E2E2E] space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Tone</label>
                      <select 
                        value={persona.tone}
                        onChange={(e) => setPersona({...persona, tone: e.target.value})}
                        className="w-full p-2 bg-gray-50 dark:bg-[#262626] rounded-lg text-sm"
                      >
                        <option value="empathetic">Empathetic</option>
                        <option value="analytical">Analytical</option>
                        <option value="poetic">Poetic</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input 
                        type="checkbox" 
                        checked={persona.useEmojis}
                        onChange={(e) => setPersona({...persona, useEmojis: e.target.checked})}
                      />
                      Use Emojis
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Interface */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-h-0 flex flex-col"
          >
            <WinDearAssistant 
              onSendMessage={handleAssistantMessage}
              isSubmitting={isAssistantLoading}
              t={t}
              entries={entries}
              messages={messages}
              persona={persona}
            />
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
