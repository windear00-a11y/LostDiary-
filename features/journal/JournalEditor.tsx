'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Undo, Redo, Type, Bold, Italic, 
  Underline, List, AlignLeft, AlignCenter, AlignRight, 
  Image as ImageIcon, CheckSquare, Save, Check, X,
  Clock, Hash, Sparkles, Plus
} from 'lucide-react';
import { coreService } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useUIStore } from '@/lib/store/use-ui-store';

export const JournalEditor = () => {
  const { setActiveView, selectedJournalContent, setSelectedJournalContent, language } = useUIStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(selectedJournalContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showNudge, setShowNudge] = useState(false);
  const [recentEntry, setRecentEntry] = useState<any>(null);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Check for recent entries on mount
  useEffect(() => {
    const checkRecent = async () => {
      const user = await authService.getUser();
      if (!user) return;
      
      const entries = await coreService.fetchDiaryEntries(user.id);
      if (entries && entries.length > 0) {
        const latest = entries[0];
        const lastTime = new Date(latest.updated_at).getTime();
        const now = new Date().getTime();
        const diffHours = (now - lastTime) / (1000 * 60 * 60);

        // If less than 12 hours, show nudge
        if (diffHours < 12 && !selectedJournalContent) {
          setRecentEntry(latest);
          setShowNudge(true);
        }
      }
    };
    checkRecent();
  }, [selectedJournalContent]);

  // Update content when selected content changes (from drawer)
  useEffect(() => {
    if (selectedJournalContent) {
      // Basic splitting for existing entries if they follow a pattern
      if (selectedJournalContent.startsWith('# ')) {
        const lines = selectedJournalContent.split('\n');
        setTitle(lines[0].replace('# ', ''));
        setContent(lines.slice(1).join('\n').trim());
      } else {
        setContent(selectedJournalContent);
      }
    }
  }, [selectedJournalContent]);

  const journalStarters = [
    { text: "Aaj mere dil ki baatein jo sirf yahan hain...", icon: "🗝️" },
    { text: "Aaj main khud se kya kehna chahta hoon?", icon: "👤" },
    { text: "Wo ehsas jo lafzon mein nahi aa raha...", icon: "🌊" },
    { text: "Main is waqt kahan hoon aur kaisa mehsoos kar rha hoon?", icon: "📍" },
    { text: "Bina kisi darr ke, aaj ki sabse kadi sachayi.", icon: "💎" },
  ];

  const handleSelectStarter = (starterText: string) => {
    setTitle(starterText);
    setContent('');
    if (contentRef.current) {
      contentRef.current.focus();
    }
  };

  const handleSave = async () => {
    if (!content.trim() && !title.trim() || isSaving) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const user = await authService.getUser();
      if (!user) throw new Error('User not found');

      // Combine title and content
      const fullContent = title ? `# ${title}\n\n${content}` : content;

      await coreService.saveDiaryEntry(user.id, fullContent, { language });
      setSaveStatus('success');
      // No more auto-redirect to chat. Stay on page for "Suqoon".
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save diary entry:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartNewEntry = () => {
    setTitle('');
    setContent('');
    setSelectedJournalContent(null);
    setShowNudge(false);
  };

  const handleFormat = (type: string) => {
    // Simple formatting logic for a textarea
    if (!contentRef.current) return;
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let replacement = '';
    switch (type) {
      case 'bold': replacement = `**${selectedText}**`; break;
      case 'italic': replacement = `*${selectedText}*`; break;
      case 'bullet': replacement = `\n- ${selectedText}`; break;
      case 'checklist': replacement = `\n- [ ] ${selectedText}`; break;
      default: replacement = selectedText;
    }

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    
    // Maintain focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const stats = {
    chars: content.length + title.length,
    date: new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-200">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button 
          onClick={() => {
            setSelectedJournalContent(null);
            setActiveView('chat');
          }}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-400" />
        </button>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={handleStartNewEntry}
            className="p-2 text-neutral-500 hover:text-white transition-colors"
            title="Start New Entry"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="w-[1px] h-4 bg-white/5 mx-1" />
          <button className="p-2 text-neutral-500 hover:text-white transition-colors">
            <Undo className="w-5 h-5" />
          </button>
          <button className="p-2 text-neutral-500 hover:text-white transition-colors">
            <Redo className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || (!title.trim() && !content.trim())}
            className={`ml-2 p-2 rounded-full transition-all ${saveStatus === 'success' ? 'text-green-400' : 'text-indigo-400 hover:bg-indigo-400/10'}`}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : saveStatus === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Metadata Stats */}
      <div className={`px-6 pt-8 pb-4 max-w-2xl mx-auto w-full transition-all duration-700 ${showNudge ? 'blur-2xl opacity-20 scale-[0.98]' : 'blur-0 opacity-100 scale-100'}`}>
        <input 
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent border-none outline-none text-3xl font-serif italic text-white placeholder:text-neutral-800"
        />
        <div className="flex items-center gap-4 mt-2 text-[10px] uppercase tracking-widest text-neutral-600 font-mono">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {stats.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Hash className="w-3 h-3" />
            {stats.chars} characters
          </span>
        </div>
      </div>

      {/* Editor Area */}
      <div className={`flex-1 px-6 max-w-2xl mx-auto w-full overflow-y-auto scrollbar-whatsapp pb-32 transition-all duration-700 ${showNudge ? 'blur-2xl opacity-20 scale-[0.98]' : 'blur-0 opacity-100 scale-100'}`}>
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your heart out..."
          className="w-full h-full bg-transparent border-none outline-none resize-none 
                     text-lg leading-relaxed font-sans placeholder:text-neutral-800
                     selection:bg-indigo-500/20"
        />
        
        {content.length === 0 && title.length === 0 && !showNudge && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 pointer-events-none">
             <div className="w-full max-w-sm space-y-6 pointer-events-auto">
               <p className="text-center text-xs uppercase tracking-[0.2em] text-neutral-600 font-medium mb-8">Choose a theme to begin</p>
               <div className="grid grid-cols-1 gap-3">
                 {journalStarters.map((starter, i) => (
                   <motion.button
                     key={i}
                     whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => handleSelectStarter(starter.text)}
                     className="w-full flex items-center gap-4 px-5 py-4 bg-neutral-900/40 border border-white/5 rounded-2xl text-sm text-white/50 hover:text-white transition-all text-left"
                   >
                     <span className="text-lg bg-white/5 w-10 h-10 flex items-center justify-center rounded-xl">{starter.icon}</span>
                     <span className="font-serif italic text-base">{starter.text}</span>
                   </motion.button>
                 ))}
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Continue vs New Nudge */}
      <AnimatePresence>
        {showNudge && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-neutral-950/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="bg-neutral-900/80 border border-white/10 rounded-[32px] p-8 text-center max-w-sm w-full shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative"
            >
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>

              <div className="space-y-3 mb-10">
                <h3 className="text-2xl font-serif italic text-white leading-tight">
                  Dil ka ek panna khali hai...
                </h3>
                <p className="text-sm text-slate-400 font-serif leading-relaxed px-4">
                  Aapke pichle page se hi likhna jaari (continue) rakhein? Ya naye page (panne) se shuru karein?
                </p>
              </div>

              <div className="space-y-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedJournalContent(recentEntry.content);
                    setShowNudge(false);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-medium shadow-[0_10px_20px_rgba(79,70,229,0.3)] transition-all"
                >
                  Pichla panna jaari rakhein
                </motion.button>
                
                <button 
                  onClick={handleStartNewEntry}
                  className="w-full py-3 text-white/60 hover:text-white text-xs font-medium transition-all"
                >
                  Nayi entry shuru karein
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toolbar (Helper Icons) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xl h-14 bg-neutral-900/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-around px-2 z-50">
        <div className="flex items-center justify-around w-full overflow-x-auto scrollbar-none py-2">
          <button onClick={() => handleFormat('checklist')} className="p-2 text-neutral-400 hover:text-white transition-colors shrink-0">
            <CheckSquare className="w-5 h-5" />
          </button>
          <button onClick={() => handleFormat('image')} className="p-2 text-neutral-400 hover:text-white transition-colors shrink-0">
            <ImageIcon className="w-5 h-5" />
          </button>
          <button className="p-2 text-neutral-400 hover:text-white transition-colors shrink-0">
            <Type className="w-5 h-5" />
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1 shrink-0" />
          <button onClick={() => handleFormat('bold')} className="p-2 text-neutral-400 hover:text-white transition-colors shrink-0">
            <Bold className="w-5 h-5" />
          </button>
          <button onClick={() => handleFormat('italic')} className="p-2 text-neutral-400 hover:text-white transition-colors shrink-0" >
            <Italic className="w-5 h-5" />
          </button>
          <button onClick={() => handleFormat('underline')} className="p-2 text-neutral-400 hover:text-white transition-colors shrink-0">
            <Underline className="w-5 h-5" />
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1 shrink-0" />
          <button onClick={() => handleFormat('bullet')} className="p-2 text-neutral-400 hover:text-white transition-colors shrink-0">
            <List className="w-5 h-5" />
          </button>
          <button className="p-2 text-neutral-400 hover:text-white transition-colors shrink-0">
            <AlignLeft className="w-5 h-5" />
          </button>
          <button className="p-2 text-neutral-400 hover:text-white transition-colors shrink-0">
            <AlignCenter className="w-5 h-5" />
          </button>
          <button className="p-2 text-neutral-400 hover:text-white transition-colors shrink-0">
            <AlignRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
