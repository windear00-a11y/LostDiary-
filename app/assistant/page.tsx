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
import { Sparkles, ArrowLeft, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [showHistory, setShowHistory] = useState(true);

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
    <AppLayout>
      <div className="flex h-[calc(100vh-100px)] gap-6">
        {/* Sidebar for Chat History */}
        <div className={`${showHistory ? 'w-64' : 'w-16'} bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-[#2E2E2E] p-4 flex flex-col gap-4 transition-all duration-300`}>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between text-sm font-bold text-gray-900 dark:text-white px-2"
          >
            {showHistory && <span>Chat History</span>}
            {showHistory ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
        <div className="flex-1 max-w-4xl space-y-8 pb-20">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-2 flex flex-col items-center sm:items-start">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-serif italic text-gray-900 dark:text-[#F9FAFB]">
                  WinDear Soul
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Talk to the soul of your diary. Ask about your patterns, memories, or just share your heart.
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-4">
              {/* Collapsible Settings Menu */}
              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm overflow-hidden">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full p-4 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors"
                >
                  <span>Assistant Settings</span>
                  {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[calc(100vh-350px)] min-h-[500px]"
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
