'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Undo, Redo, Type, Bold, Italic, 
  Underline, List, AlignLeft, AlignCenter, AlignRight, 
  Image as ImageIcon, CheckSquare, Save, Check, X,
  Clock, Hash, Sparkles, Plus, Shield
} from 'lucide-react';
import { coreService } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useUIStore } from '@/lib/store/use-ui-store';
import { useSearchParams } from 'next/navigation';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { SuccessMoment } from '@/components/ui/SuccessMoment';
import { toast } from 'sonner';
import { NudgeService } from '@/lib/services/nudge-service';

export const JournalEditor = () => {
  const { setActiveView, selectedJournalContent, setSelectedJournalContent, language, isInputFocused, setInputFocused } = useUIStore();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(selectedJournalContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showNudge, setShowNudge] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccessMoment, setShowSuccessMoment] = useState(false);
  const [recentEntry, setRecentEntry] = useState<any>(null);
  const [inspiredBy, setInspiredBy] = useState<string | null>(null);
  const [inspirationAuthor, setInspirationAuthor] = useState<string | null>(null);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Check for recent entries on mount
  useEffect(() => {
    const inspireId = searchParams?.get('inspire');
    const author = searchParams?.get('author');
    if (inspireId) {
       setInspiredBy(inspireId);
       setInspirationAuthor(author);
       setTitle(language === 'hi' ? 'Ek Kahani Se Prerit...' : 'Inspired by a whisper...');
       setContent(language === 'hi' ? `Maine library mein ${author ? author + ' ki ' : ''}kahani padhi aur mujhe yaad aaya...\n\n` : `"I read a whisper ${author ? 'by ' + author + ' ' : ''}in the library, and it reminded me of..."\n\n`);
       return; // skip nudge check if inspired
    }

    // Check local draft first
    const localDraftTitle = localStorage.getItem('journalDraft_title');
    const localDraftContent = localStorage.getItem('journalDraft_content');
    
    if (localDraftTitle || localDraftContent) {
      if (!selectedJournalContent) {
        setRecentEntry({ 
          content: `${localDraftTitle ? `# ${localDraftTitle}\n\n` : ''}${localDraftContent || ''}`.trim(),
          isLocalDraft: true 
        });
        setShowNudge(true);
        return; // Don't check server if local draft exists
      }
    }

    const checkRecent = async () => {
      const user = await authService.getUser();
      if (!user) return;
      
      const entries = await coreService.fetchDiaryEntries(user.id);
      if (entries && entries.length > 0) {
        const latest = entries[0];
        const lastTime = new Date(latest.updated_at).getTime();
        const now = new Date().getTime();
        const diffHours = (now - lastTime) / (1000 * 60 * 60);

        // If less than 12 hours since last entry, show nudge
        if (diffHours < 12 && !selectedJournalContent && NudgeService.shouldShowNudge('journal', 12)) {
          setRecentEntry(latest);
          setShowNudge(true);
          NudgeService.markNudgeShown('journal');
        }
      }
    };
    checkRecent();
  }, [selectedJournalContent, language, searchParams]);

  // Auto-save logic
  useEffect(() => {
    setIsSavingLocal(true);
    const timer = setTimeout(() => {
      if (title || content) {
        localStorage.setItem('journalDraft_title', title);
        localStorage.setItem('journalDraft_content', content);
      } else {
        localStorage.removeItem('journalDraft_title');
        localStorage.removeItem('journalDraft_content');
      }
      setIsSavingLocal(false);
    }, 1000); // 1-second debounce
    
    return () => clearTimeout(timer);
  }, [title, content]);

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
      if (!user) {
        setShowAuthModal(true);
        setIsSaving(false);
        return;
      }

      // Combine title and content
      const fullContent = title ? `# ${title}\n\n${content}` : content;

      await coreService.saveDiaryEntry(user.id, fullContent, { 
        language, 
        inspired_by: inspiredBy,
        inspiration_author: inspirationAuthor 
      });
      setSaveStatus('success');
      setShowSuccessMoment(true);
      
      // Clear auto-saved draft
      localStorage.removeItem('journalDraft_title');
      localStorage.removeItem('journalDraft_content');
      
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
    
    // Clear auto-saved draft
    localStorage.removeItem('journalDraft_title');
    localStorage.removeItem('journalDraft_content');
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

  const [showUI, setShowUI] = useState(true);

  // Focus Mode logic - Pattern 6 (Smart Interactions)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (content.length > 0) {
      timer = setTimeout(() => {
        setShowUI(false);
      }, 2500); 
    } else {
      setShowUI(true);
    }
    return () => clearTimeout(timer);
  }, [content]);

  // Visual cues for focus mode
  const handleEditorFocus = () => {
    setShowUI(true);
    setInputFocused(true);
  };
  const handleEditorBlur = () => {
    // Only remove focus state if we're not clicking on formatting icons
    setTimeout(() => {
      setInputFocused(false);
    }, 200);
  };
  const handleEditorClick = () => setShowUI(true);
  const handleMouseMove = () => {
    if (!showUI) setShowUI(true);
  };

  const textToCount = `${title} ${content}`.trim();
  const stats = {
    words: textToCount ? textToCount.split(/\\s+/).length : 0,
    date: new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-neutral-200 overflow-hidden relative font-sans" onMouseMove={handleMouseMove}>
      {/* Background Ambience - Simplified and Elegant */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.02] blur-[120px] rounded-[100%] pointer-events-none" />
      </div>

      {/* Top Header - Pattern 1 (Fades out for Focus) */}
      <motion.div 
        animate={{ 
          opacity: showUI ? 1 : 0, 
          y: showUI ? 0 : -20,
          pointerEvents: showUI ? 'auto' : 'none'
        }}
        className="flex items-center justify-between px-6 pt-16 pb-4 border-b border-white/5 z-20 bg-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col select-none">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Canvas</span>
            <span className="text-sm font-serif italic text-white/70">Sanctuary</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleStartNewEntry}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            title="New Journal"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-2" />
          <button 
            onClick={handleSave}
            disabled={isSaving || (!title.trim() && !content.trim())}
            className={`px-6 py-2.5 flex items-center gap-2 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all ${saveStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:bg-white/20 disabled:text-white/50'}`}
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : saveStatus === 'success' ? (
              <>Saved <Check className="w-3.5 h-3.5" /></>
            ) : (
              <>Save <Save className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      </motion.div>

      {/* Metadata Stats */}
      <div className={`px-6 pt-8 pb-4 max-w-3xl mx-auto w-full transition-all duration-700 relative z-10 ${showNudge ? 'blur-sm opacity-20 scale-[0.98]' : 'blur-0 opacity-100 scale-100'}`}>
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center w-full">
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title your entry..."
              className="w-full bg-transparent border-none outline-none text-3xl md:text-5xl font-serif italic text-white placeholder:text-white/20 selection:bg-white/20 transition-all placeholder:transition-colors focus:placeholder:text-white/5"
            />
            {/* Auto-save indicator */}
            <AnimatePresence>
              {(title || content) && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 whitespace-nowrap shrink-0"
                 >
                   <span className={`w-1.5 h-1.5 rounded-full ${isSavingLocal ? 'bg-white/40 animate-pulse' : 'bg-indigo-500'}`} />
                   <span className="text-[9px] uppercase tracking-widest text-white/50 font-medium">
                     {isSavingLocal ? 'Saving...' : 'Draft Saved'}
                   </span>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-white/40 font-bold overflow-x-auto scrollbar-hide py-1">
              <span className="flex items-center gap-2 whitespace-nowrap bg-white/[0.03] py-1.5 px-3.5 rounded-full border border-white/5 backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5 opacity-70" />
                {stats.date}
              </span>
              <span className="flex items-center gap-2 whitespace-nowrap bg-white/[0.03] py-1.5 px-3.5 rounded-full border border-white/5 backdrop-blur-sm">
                <Hash className="w-3.5 h-3.5 opacity-70" />
                {stats.words} Words
              </span>
            </div>
             {/* Mobile Auto-save indicator */}
            <AnimatePresence>
              {(title || content) && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="flex sm:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 whitespace-nowrap shrink-0"
                 >
                   <span className={`w-1.5 h-1.5 rounded-full ${isSavingLocal ? 'bg-white/40 animate-pulse' : 'bg-indigo-500'}`} />
                   <span className="text-[9px] uppercase tracking-widest text-white/50 font-medium">
                     {isSavingLocal ? 'Saving...' : 'Saved'}
                   </span>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className={`flex-1 px-6 max-w-3xl mx-auto w-full overflow-y-auto scrollbar-whatsapp pb-40 relative z-10 transition-all duration-700 ${showNudge ? 'blur-sm opacity-20 scale-[0.98]' : 'blur-0 opacity-100 scale-100'}`}>
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setShowUI(true);
          }}
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
          onClick={handleEditorClick}
          placeholder="Write your thoughts..."
          className="w-full h-full bg-transparent border-none outline-none resize-none 
                     text-lg md:text-xl leading-[1.8] font-serif text-white/90 placeholder:text-white/20
                     selection:bg-white/20"
        />
        
        {content.length === 0 && title.length === 0 && !showNudge && (
           <div className="absolute inset-0 flex flex-col pt-10 pointer-events-none px-6">
             <div className="w-full max-w-2xl mx-auto space-y-6 pointer-events-auto">
               <div className="flex items-center gap-4 mb-8">
                 <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1" />
                 <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Prompts to start
                 </p>
                 <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1" />
               </div>
               <div className="grid gap-3">
                 {journalStarters.map((starter, i) => (
                   <motion.button
                     key={i}
                     whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                     whileTap={{ scale: 0.99 }}
                     onClick={() => handleSelectStarter(starter.text)}
                     className="w-full flex items-center gap-5 py-4 px-5 rounded-2xl text-[14px] text-white/60 hover:text-white transition-all text-left bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] group"
                   >
                     <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/10 group-hover:scale-110 transition-all border border-white/5 group-hover:border-indigo-500/30">
                       <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">{starter.icon}</span>
                     </div>
                     <span className="font-serif italic leading-relaxed pt-1 group-hover:translate-x-1 transition-transform duration-300">{starter.text}</span>
                   </motion.button>
                 ))}
               </div>
               {/* Add extra padding at the bottom so it doesn't hide under the floating toolbar */}
               <div className="h-40" />
             </div>
           </div>
        )}
      </div>

      {/* Continue vs New Nudge */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthPromptModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        )}
        {showNudge && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-neutral-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="bg-[#111] border border-white/10 rounded-[32px] p-10 text-center max-w-sm w-full shadow-2xl backdrop-blur-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <Clock className="w-8 h-8 text-white/50" />
              </div>

              <div className="space-y-3 mb-10 relative z-10">
                <h3 className="text-2xl font-serif italic text-white leading-tight">
                  {recentEntry?.isLocalDraft ? 'Unsaved draft found...' : 'Draft saved...'}
                </h3>
                <p className="text-sm text-white/50 font-sans leading-relaxed px-4">
                  {recentEntry?.isLocalDraft ? 'You have an unsaved reflection. Would you like to continue it?' : 'Would you like to pick up where you left off, or start a new weave?'}
                </p>
              </div>

              <div className="space-y-3 relative z-10">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedJournalContent(recentEntry.content);
                    setShowNudge(false);
                  }}
                  className="w-full py-4 bg-white text-black hover:bg-neutral-200 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all"
                >
                  Continue
                </motion.button>
                
                <button 
                  onClick={handleStartNewEntry}
                  className="w-full py-3 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Start New
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence> 

      {/* Floating Toolbar (Helper Icons) - Minimal*/}
      <motion.div 
        animate={{ 
          opacity: showUI || isInputFocused ? 1 : 0, 
          y: showUI || isInputFocused ? 0 : 20,
          pointerEvents: showUI || isInputFocused ? 'auto' : 'none'
      }}
      whileHover={{ opacity: 1, y: 0 }}
      className={`fixed left-1/2 -translate-x-1/2 bg-[#1A1A1A] border border-white/10 rounded-full shadow-2xl flex items-center justify-center px-2 py-1.5 z-[70] transition-all duration-500 ${isInputFocused ? 'bottom-4' : 'bottom-[calc(80px+env(safe-area-inset-bottom))]'}`}
    >
      <div className="flex items-center gap-1">
          <button onClick={() => handleFormat('checklist')} className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0">
            <CheckSquare className="w-4 h-4" />
          </button>
          <button onClick={() => handleFormat('image')} className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0">
            <ImageIcon className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1 shrink-0" />
          <button onClick={() => handleFormat('bold')} className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => handleFormat('italic')} className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0" >
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => handleFormat('bullet')} className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0">
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
      <SuccessMoment 
        isOpen={showSuccessMoment} 
        onClose={() => setShowSuccessMoment(false)}
        title={inspiredBy ? (language === 'hi' ? 'Ehsaas ka Dhaga Buna Gaya' : 'Thread Spun') : (language === 'hi' ? 'Ehsaas Mehfooz Hua' : 'Reflection Safe')}
        subtitle={inspiredBy ? (language === 'hi' ? 'Aapka ehsaas ab zameen-e-sanctuary ka hissa hai.' : 'Your reflection is now part of the sanctuary weave.') : (language === 'hi' ? 'Aapki yaad sanctuary mein mehfooz hai.' : 'Your thought is safe in the sanctuary.')}
        type="save"
      />
    </div>
  );
};
