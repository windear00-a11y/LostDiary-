'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Check, X, BookOpen } from 'lucide-react';
import { coreService } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useUIStore } from '@/lib/store/use-ui-store';

export const JournalEditor = () => {
  const { setActiveView, selectedJournalContent, setSelectedJournalContent } = useUIStore();
  const [content, setContent] = useState(selectedJournalContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Update content when selected content changes (from drawer)
  useEffect(() => {
    setContent(selectedJournalContent || '');
  }, [selectedJournalContent]);

  const handleSave = async () => {
    if (!content.trim() || isSaving) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const user = await authService.getUser();
      if (!user) throw new Error('User not found');

      await coreService.saveDiaryEntry(user.id, content);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
      // Optional: Clear or keep content? Usually diary entries are "new" every time in this simplified logic.
      // But maybe we just want to clear it after successful save or redirect.
      setContent('');
    } catch (error) {
      console.error('Failed to save diary entry:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-200 p-6 md:p-12 max-w-4xl mx-auto w-full">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-neutral-400" />
          <h2 className="text-xl font-medium tracking-tight font-sans">Daily Journal</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setSelectedJournalContent(null);
              setActiveView('chat');
            }}
            className="text-neutral-500 hover:text-neutral-200 transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind today? Write freely..."
          className="flex-1 w-full bg-transparent border-none outline-none resize-none 
                     text-lg md:text-xl leading-relaxed font-sans placeholder:text-neutral-700
                     selection:bg-neutral-800"
          autoFocus
        />
      </div>

      {/* Footer / Controls */}
      <div className="mt-8 flex items-center justify-end">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={!content.trim() || isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300
                    ${saveStatus === 'success' ? 'bg-green-500/20 text-green-400' : 
                      saveStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-neutral-100 text-neutral-950 hover:bg-white'} 
                    disabled:opacity-20 disabled:cursor-not-allowed`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
          ) : saveStatus === 'success' ? (
            <>
              <Check className="w-5 h-5" />
              <span>Saved to Diary</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Entry</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};
