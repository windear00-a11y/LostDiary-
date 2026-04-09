'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { chapterService, Chapter } from '@/lib/services/chapter-service';
import { chatService } from '@/lib/services/chat-service';
import { authService } from '@/lib/services/auth-service';
import { BookRenderer } from './BookRenderer';
import { LifeAuthorEngine } from '@/ai-core/life-author';
import { analyzeEntries } from '@/ai-core/pattern-detector';

const SkeletonLoader = () => (
  <div className="max-w-[700px] mx-auto pt-20 px-6 space-y-8 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
    </div>
  </div>
);

export const BookView = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [openingText, setOpeningText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const user = await authService.getUser();
        if (user) {
          const [chaptersData, messagesData] = await Promise.all([
            chapterService.fetchChapters(user.id),
            chatService.fetchMessages(user.id)
          ]);
          
          setChapters(chaptersData);

          // Generate dynamic opening
          const authorEngine = new LifeAuthorEngine(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
          const patterns = analyzeEntries(messagesData.map(m => m.content || ""));
          const allEvents = chaptersData.flatMap(c => c.events || []);
          
          const opening = await authorEngine.generateOpening(allEvents, patterns);
          setOpeningText(opening);
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-[#fdfcfb] dark:bg-[#0d0d0d] min-h-screen transition-colors duration-700"
    >
      <div className="max-w-[700px] mx-auto pt-24 pb-32 px-8">
        {chapters.length === 0 ? (
          <div className="py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-50 dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-8">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-4xl font-serif italic text-gray-800 dark:text-gray-200">Your story starts here...</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              जैसे-जैसे आप असिस्टेंट के साथ अपने विचार साझा करेंगे, आपकी &apos;लाइफ बुक&apos; खुद-ब-खुद यहाँ लिखी जाएगी।
            </p>
          </div>
        ) : (
          <>
            {openingText && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="mb-32 font-serif text-3xl italic text-gray-800 dark:text-gray-200 leading-relaxed tracking-tight"
              >
                <p>{openingText}</p>
              </motion.div>
            )}
            <BookRenderer chapters={chapters} />
          </>
        )}
      </div>
    </motion.div>
  );
};
