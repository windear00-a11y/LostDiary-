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

export const JournalEditor = () => {
  const { setActiveView, selectedJournalContent, setSelectedJournalContent, language } = useUIStore();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(selectedJournalContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showNudge, setShowNudge] = useState(false);
  const [hasShownNudge, setHasShownNudge] = useState(false);
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
    const checkRecent = async () => {
      const user = await authService.getUser();
      if (!user) return;
      
      const entries = await coreService.fetchDiaryEntries(user.id);
      if (entries && entries.length > 0) {
        const latest = entries[0];
        const lastTime = new Date(latest.updated_at).getTime();
        const now = new Date().getTime();
        const diffHours = (now - lastTime) / (1000 * 60 * 60);

        // If less than 12 hours, show nudge - only if not shown yet this session
        if (diffHours < 12 && !selectedJournalContent && !hasShownNudge) {
          setRecentEntry(latest);
          setShowNudge(true);
          setHasShownNudge(true);
        }
      }
    };
    checkRecent();
  }, [selectedJournalContent, language, searchParams]);

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

  const [showUI, setShowUI] = useState(true);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Focus Mode logic - Pattern 6 (Smart Interactions)
  useEffect(() => {
    if (content.length > 0) {
      if (typingTimeout) clearTimeout(typingTimeout);
      const timer = setTimeout(() => {
        setShowUI(false);
      }, 2500); 
      setTypingTimeout(timer);
    } else {
      setShowUI(true);
    }
  }, [content]);

  // Visual cues for focus mode
  const handleEditorFocus = () => setShowUI(true);
  const handleEditorClick = () => setShowUI(true);
  const handleMouseMove = () => {
    if (!showUI) setShowUI(true);
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
    <div className="h-full flex flex-col bg-[#050505] text-neutral-200 overflow-hidden relative" onMouseMove={handleMouseMove}>
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-screen" />
      </div>

      {/* Top Header - Pattern 1 (Fades out for Focus) */}
      <motion.div 
        animate={{ 
          opacity: showUI ? 1 : 0, 
          y: showUI ? 0 : -20,
          pointerEvents: showUI ? 'auto' : 'none'
        }}
        className="flex items-center justify-end px-6 pt-16 pb-4 border-b border-white/5 z-20 bg-transparent backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-indigo-900/20 rounded-full border border-indigo-500/20 mr-4 select-none shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Sanctuary Weave Active</span>
          </div>
          <button 
            onClick={handleStartNewEntry}
            className="p-2 text-indigo-500/50 hover:text-indigo-400 transition-colors"
            title="Weave New Thread"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="w-[1px] h-4 bg-white/5 mx-2" />
          <button 
            onClick={handleSave}
            disabled={isSaving || (!title.trim() && !content.trim())}
            className={`ml-2 px-6 py-2 flex items-center gap-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${saveStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.2)] hover:bg-indigo-500 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:bg-indigo-900/50'}`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveStatus === 'success' ? (
              <>Sealed <Check className="w-3 h-3" /></>
            ) : (
              <>Seal Thread <Save className="w-3 h-3" /></>
            )}
          </button>
        </div>
      </motion.div>

      {/* Metadata Stats */}
      <div className={`px-6 pt-12 pb-6 max-w-3xl mx-auto w-full transition-all duration-700 relative z-10 ${showNudge ? 'blur-sm opacity-20 scale-[0.98]' : 'blur-0 opacity-100 scale-100'}`}>
        <input 
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this soul-thread a name..."
          className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-serif italic text-white placeholder:text-indigo-100/20 drop-shadow-lg"
        />
        <div className="flex items-center gap-6 mt-6 text-[10px] uppercase tracking-[0.3em] text-indigo-400/60 font-bold">
          <span className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {stats.date}
          </span>
          <div className="w-1 h-1 rounded-full bg-indigo-500/30" />
          <span className="flex items-center gap-2">
            <Hash className="w-3.5 h-3.5" />
            {stats.chars} Essence
          </span>
        </div>
      </div>

      {/* Editor Area */}
      <div className={`flex-1 px-6 max-w-3xl mx-auto w-full overflow-y-auto scrollbar-whatsapp pb-40 relative z-10 transition-all duration-700 ${showNudge ? 'blur-sm opacity-20 scale-[0.98]' : 'blur-0 opacity-100 scale-100'}`}>
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={handleEditorFocus}
          onClick={handleEditorClick}
          placeholder="The canvas is listening to your whispers..."
          className="w-full h-full bg-transparent border-none outline-none resize-none 
                     text-xl md:text-2xl leading-relaxed font-serif text-white font-medium placeholder:text-indigo-100/30
                     drop-shadow-md selection:bg-indigo-500/30"
        />
        
        {content.length === 0 && title.length === 0 && !showNudge && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 pointer-events-none">
             <div className="w-full max-w-lg space-y-6 pointer-events-auto">
               <p className="text-center text-sm uppercase tracking-[0.4em] text-indigo-300 font-bold mb-10 drop-shadow-md">Summon a Thought</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {journalStarters.map((starter, i) => (
                   <motion.button
                     key={i}
                     whileHover={{ y: -2, backgroundColor: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.4)" }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => handleSelectStarter(starter.text)}
                     className="w-full flex items-start gap-4 p-5 bg-[#121215]/80 border border-indigo-500/20 rounded-3xl text-sm text-indigo-50 hover:text-white transition-all text-left backdrop-blur-sm group shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
                   >
                     <span className="text-2xl bg-indigo-500/20 w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all text-indigo-200">{starter.icon}</span>
                     <span className="font-serif italic leading-relaxed pt-1 font-medium">{starter.text}</span>
                   </motion.button>
                 ))}
               </div>
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
              className="bg-[#0c0c0e]/90 border border-indigo-500/20 rounded-[32px] p-10 text-center max-w-sm w-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent pointer-events-none" />
              
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <Clock className="w-8 h-8 text-indigo-400" />
              </div>

              <div className="space-y-3 mb-10 relative z-10">
                <h3 className="text-2xl font-serif italic text-white leading-tight">
                  An unfinished whisper...
                </h3>
                <p className="text-sm text-indigo-200/60 font-serif leading-relaxed px-4">
                  A thread was left weaving. Would you like to pick up where you left off, or start a new weave?
                </p>
              </div>

              <div className="space-y-4 relative z-10">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedJournalContent(recentEntry.content);
                    setShowNudge(false);
                  }}
                  className="w-full py-4 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-[0_10px_20px_rgba(79,70,229,0.2)] transition-all border border-indigo-500/50"
                >
                  Continue Weaving
                </motion.button>
                
                <button 
                  onClick={handleStartNewEntry}
                  className="w-full py-3 text-indigo-400/50 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Start New Thread
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toolbar (Helper Icons) - Pattern 1 & 6 */}
      <motion.div 
        animate={{ 
          opacity: showUI ? 1 : 0.05, 
          y: showUI ? 0 : 40,
          scale: showUI ? 1 : 0.95,
          pointerEvents: showUI ? 'auto' : 'none'
        }}
        whileHover={{ opacity: 1, y: 0, scale: 1 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-xl h-14 bg-[#0a0a0c]/80 border border-indigo-500/20 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center justify-around px-4 z-[70] transition-colors"
      >
        <div className="flex items-center justify-around w-full overflow-x-auto scrollbar-none py-2 gap-2">
          <button onClick={() => handleFormat('checklist')} className="p-2 text-indigo-200/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors shrink-0">
            <CheckSquare className="w-4 h-4" />
          </button>
          <button onClick={() => handleFormat('image')} className="p-2 text-indigo-200/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors shrink-0">
            <ImageIcon className="w-4 h-4" />
          </button>
          <button className="p-2 text-indigo-200/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors shrink-0">
            <Type className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-6 bg-indigo-500/20 mx-2 shrink-0" />
          <button onClick={() => handleFormat('bold')} className="p-2 text-indigo-200/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors shrink-0">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => handleFormat('italic')} className="p-2 text-indigo-200/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors shrink-0" >
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => handleFormat('underline')} className="p-2 text-indigo-200/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors shrink-0">
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-6 bg-indigo-500/20 mx-2 shrink-0" />
          <button onClick={() => handleFormat('bullet')} className="p-2 text-indigo-200/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors shrink-0">
            <List className="w-4 h-4" />
          </button>
          <button className="p-2 text-indigo-200/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors shrink-0">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button className="p-2 text-indigo-200/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors shrink-0">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button className="p-2 text-indigo-200/40 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors shrink-0">
            <AlignRight className="w-4 h-4" />
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
