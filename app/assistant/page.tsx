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
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function AssistantPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { aiCalls, entryCount, trackAICall } = useResourceUsage();
  
  const [entries, setEntries] = useState<any[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const supabase = createClient();

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
    }
  }, [user, fetchEntries]);

  const handleAssistantMessage = async (message: string) => {
    if (!supabase || !user) return null;
    setIsAssistantLoading(true);
    try {
      trackAICall();
      const { classifyIntent, handleChat } = await import('@/lib/ai');
      let intent = await classifyIntent(message);
      const chatIntent: 'recall' | 'analysis' | 'chat' = intent === 'entry' ? 'chat' : intent;
      
      const response = await handleChat(message, entries, chatIntent, {
        understand_language: 'en',
        output_language: 'en'
      });
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
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
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

          <div className="w-full sm:w-72">
            <AIUsageDashboard 
              aiCalls={aiCalls}
              entryCount={entryCount}
              t={t}
            />
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
          />
        </motion.div>
      </div>
    </AppLayout>
  );
}
