'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Undo, Redo, Type, Bold, Italic, 
  Underline, List, AlignLeft, AlignCenter, AlignRight, 
  CheckSquare, Save, Check, X,
  Clock, Hash, Sparkles, Plus, Shield, Mic
} from 'lucide-react';
import { coreService } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { useUIStore } from '@/lib/store/use-ui-store';
import { useSearchParams } from 'next/navigation';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { SuccessMoment } from '@/components/ui/SuccessMoment';
import { toast } from 'sonner';
import { NudgeService } from '@/lib/services/nudge-service';

// TipTap Imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

export const JournalEditor = () => {
  const { setActiveView, selectedJournalContent, setSelectedJournalContent, language, isInputFocused, setInputFocused, setIsDrawerOpen } = useUIStore();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(selectedJournalContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showNudge, setShowNudge] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccessMoment, setShowSuccessMoment] = useState(false);
  const [isFormattingExpanded, setIsFormattingExpanded] = useState(false);
  const [recentEntry, setRecentEntry] = useState<any>(null);
  const [inspiredBy, setInspiredBy] = useState<string | null>(null);
  const [inspirationAuthor, setInspirationAuthor] = useState<string | null>(null);
  
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  
  const [isWeaving, setIsWeaving] = useState(false);
 
  const titleRef = useRef<HTMLTextAreaElement>(null);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your thoughts...',
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: selectedJournalContent || content || '',
    editorProps: {
      attributes: {
        class: 'w-full min-h-[50vh] prose prose-invert prose-p:text-lg md:prose-p:text-xl prose-p:leading-[1.8] prose-p:font-serif prose-p:text-[var(--color-primary-text-dark)] prose-headings:font-serif prose-headings:text-[var(--color-primary-text-dark)] focus:outline-none selection:bg-[var(--color-accent-amber)]/20 pb-32 max-w-none',
      },
      handleDOMEvents: {
        focus: () => {
          handleEditorFocus();
          return false;
        },
        blur: () => {
          handleEditorBlur();
          return false;
        }
      }
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
      setShowUI(true);
    },
  });

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            editor?.commands.insertContent(finalTranscript + ' ');
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
         recognitionRef.current.stop();
      }
    };
  }, [editor]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        toast.error('Voice dictation is not supported in this browser.');
        return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success(language === 'hi' ? 'Sunte hue...' : 'Listening...');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Offline sync
  useEffect(() => {
    const handleOnline = async () => {
        const offlineEntries = JSON.parse(localStorage.getItem('journalOfflineQueue') || '[]');
        if (offlineEntries.length > 0) {
            const user = await authService.getUser();
            if (user) {
                toast.loading('Syncing offline entries...', { id: 'offline-sync' });
                try {
                    for (const entry of offlineEntries) {
                        const { processingStatus } = await coreService.saveDiaryEntry(user.id, entry.content, entry.metadata);
                        if (processingStatus === 'woven' || processingStatus === 'saved') {
                           useUIStore.getState().triggerMemorySync();
                        }
                    }
                    localStorage.removeItem('journalOfflineQueue');
                    toast.dismiss('offline-sync');
                    toast.success('Offline entries synced successfully.');
                } catch (e) {
                    console.error('Failed to sync offline entries', e);
                    toast.dismiss('offline-sync');
                    toast.error('Failed to sync some offline entries.');
                }
            }
        }
    };

    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
        handleOnline();
    }
    return () => window.removeEventListener('online', handleOnline);
  }, [language]);

  // Auto-resize areas on content change
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

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
        const restContent = lines.slice(1).join('\n').trim();
        setContent(restContent);
        editor?.commands.setContent(restContent);
      } else {
        setContent(selectedJournalContent);
        editor?.commands.setContent(selectedJournalContent);
      }
    }
  }, [selectedJournalContent, editor]);

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
    editor?.commands.setContent('');
    editor?.commands.focus();
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

      if (!navigator.onLine) {
        const offlineEntries = JSON.parse(localStorage.getItem('journalOfflineQueue') || '[]');
        offlineEntries.push({
           user_id: user.id,
           content: fullContent,
           metadata: { language, inspired_by: inspiredBy, inspiration_author: inspirationAuthor },
           created_at: new Date().toISOString()
        });
        localStorage.setItem('journalOfflineQueue', JSON.stringify(offlineEntries));
        
        setSaveStatus('success');
        setLastSavedContent(fullContent);
        toast.success('Saved offline. Will sync when connection is restored.');
        
        localStorage.removeItem('journalDraft_title');
        localStorage.removeItem('journalDraft_content');
        setTimeout(() => setSaveStatus('idle'), 3000);
        setIsSaving(false);
        return;
      }

      const { entry, processingStatus } = await coreService.saveDiaryEntry(user.id, fullContent, { 
        language, 
        inspired_by: inspiredBy,
        inspiration_author: inspirationAuthor 
        });
        
        setRecentEntry(entry);
        setSaveStatus('success');
        setShowSuccessMoment(true);
        toast.success(language === 'hi' ? 'Entry Save ho gayi!' : 'Entry saved successfully!');
        
        // We no longer auto-clear everything immediately to allow deliberate weaving
        // handleStartNewEntry(); 
        
        setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save diary entry:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWeaveToStory = async () => {
    if (!recentEntry || isWeaving) return;
    
    setIsWeaving(true);
    try {
      const user = await authService.getUser();
      if (!user) return;
      
      await coreService.weaveDiaryIntoStory(user.id, recentEntry.id);
      toast.success(language === 'hi' ? 'Kahani buni ja rahi hai...' : 'Narrative weaving started...');
      
      // Trigger animation
      useUIStore.getState().triggerMemorySync();
      
      // Clear after intentional weaving
      setTimeout(() => {
        handleStartNewEntry();
        setShowSuccessMoment(false);
      }, 2000);
    } catch (e) {
      console.error(e);
      toast.error('Weaving failed');
    } finally {
      setIsWeaving(false);
    }
  };

  const handleStartNewEntry = () => {
    setTitle('');
    setContent('');
    setLastSavedContent('');
    editor?.commands.setContent('');
    setSelectedJournalContent(null);
    setShowNudge(false);
    setShowPrompts(false);
    
    // Clear auto-saved draft
    localStorage.removeItem('journalDraft_title');
    localStorage.removeItem('journalDraft_content');
  };

  const handleFormat = (type: string) => {
    if (!editor) return;

    switch (type) {
      case 'bold': 
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic': 
        editor.chain().focus().toggleItalic().run();
        break;
      case 'bullet': 
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'checklist': 
        editor.chain().focus().toggleTaskList().run();
        break;
    }
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

  // Cleanup focus state on unmount
  useEffect(() => {
    return () => setInputFocused(false);
  }, [setInputFocused]);

  // Handle focus mode global state listener in custom global component

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
  const currentFullContent = title ? `# ${title}\n\n${content}` : content;
  const isContentUnchanged = lastSavedContent === currentFullContent;

  const stats = {
    words: textToCount ? textToCount.split(/\s+/).length : 0,
    date: new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-dark)] text-[var(--color-primary-text-dark)] overflow-hidden relative font-sans" onMouseMove={handleMouseMove}>

      {/* Background Ambience - Simplified and Elegant */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.02] blur-[120px] rounded-[100%] pointer-events-none" />
      </div>

      {/* Top padding to accommodate global header */}
      <div className="h-20 shrink-0" />

      {/* Editor Area */}
      <div className={`flex-1 px-6 pt-4 max-w-3xl mx-auto w-full overflow-y-auto scrollbar-whatsapp pb-40 relative z-10 transition-all duration-700 ${showNudge ? 'blur-sm opacity-20 scale-[0.98]' : 'blur-0 opacity-100 scale-100'}`}>
        
        {/* Metadata Stats & Title (Moved inside scroll container) */}
        <div className="flex flex-col gap-4 mb-6 pt-2">
          <div className="flex justify-between items-start w-full gap-4">
            <textarea 
              ref={titleRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              onFocus={() => {
                handleEditorFocus();
                setShowUI(true);
              }}
              onBlur={handleEditorBlur}
              placeholder="Title your entry..."
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-2xl md:text-4xl font-serif italic text-white placeholder:text-white/20 selection:bg-white/20 transition-all placeholder:transition-colors focus:placeholder:text-white/5 overflow-hidden"
              style={{ minHeight: '40px' }}
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
                   <span className={`w-1.5 h-1.5 rounded-full ${isSavingLocal ? 'bg-white/40 animate-pulse' : 'bg-amber-500'}`} />
                   <span className="text-[9px] uppercase tracking-widest text-white/50 font-medium">
                     {isSavingLocal ? 'Saving...' : 'Draft Saved'}
                   </span>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
            <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium py-1">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                {stats.date}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                {stats.words} Words
              </span>
            </div>
             {/* Mobile Auto-save indicator */}
            <AnimatePresence>
              {(title || content) && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="flex sm:hidden items-center gap-1.5 ml-2 whitespace-nowrap shrink-0"
                 >
                   <span className={`w-1 h-1 rounded-full ${isSavingLocal ? 'bg-white/30 animate-pulse' : 'bg-white/30'}`} />
                   <span className="text-[9px] uppercase tracking-widest text-white/30 font-medium">
                     {isSavingLocal ? 'Saving...' : 'Saved'}
                   </span>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Text Area & Overlay Container */}
        <div className="relative w-full">
          <div onClick={handleEditorClick} className="w-full h-full cursor-text">
            <EditorContent editor={editor} />
          </div>
          
          {editor?.isEmpty && title.length === 0 && !showNudge && (
             <div className="absolute top-0 left-0 w-full pt-16 pointer-events-none">
               <div className="w-full max-w-2xl mx-auto space-y-6 pointer-events-auto">
                 {!showPrompts ? (
                   <div className="flex justify-center mt-12">
                     <button
                       onClick={() => setShowPrompts(true)}
                       className="px-6 py-3 rounded-full glass-surface flex items-center gap-3 text-sm font-serif italic text-white/50 hover:text-[var(--color-primary-text-dark)] hover:bg-[var(--color-primary-text-dark)]/5 transition-all focus:outline-none"
                     >
                       <Sparkles className="w-4 h-4 text-amber-500/70" />
                       {language === 'hi' ? 'Kuchh soojh nahi raha?' : 'Need some inspiration?'}
                     </button>
                   </div>
                 ) : (
                   <>
                     <div className="flex items-center gap-4 mb-8">
                       <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1" />
                       <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Prompts to start
                       </p>
                       <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1" />
                     </div>
                     <div className="grid gap-3">
                       {journalStarters.map((starter, i) => (
                         <motion.button
                           key={i}
                           whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                           whileTap={{ scale: 0.99 }}
                           onClick={() => {
                             handleSelectStarter(starter.text);
                             setShowPrompts(false);
                           }}
                           className="w-full flex items-center gap-5 py-4 px-5 rounded-2xl text-[14px] text-white/60 hover:text-white transition-all text-left bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] group"
                         >
                           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-amber-500/10 group-hover:scale-110 transition-all border border-white/5 group-hover:border-amber-500/30">
                             <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">{starter.icon}</span>
                           </div>
                           <span className="font-serif italic leading-relaxed pt-1 group-hover:translate-x-1 transition-transform duration-300">{starter.text}</span>
                         </motion.button>
                       ))}
                     </div>
                   </>
                 )}
                 {/* Add extra padding at the bottom so it doesn't hide under the floating toolbar */}
                 <div className="h-40" />
               </div>
             </div>
          )}
        </div>
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
        className={`fixed right-4 bg-white/5/95 backdrop-blur-md border border-white/10 rounded-full shadow-2xl flex items-center justify-center p-1 z-[70] transition-all duration-500 overflow-hidden ${isInputFocused ? 'bottom-4' : 'bottom-[calc(80px+env(safe-area-inset-bottom))]'}`}
      >
        <AnimatePresence mode="wait">
          {isFormattingExpanded ? (
            <motion.div 
              key="expanded"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex items-center gap-1 overflow-hidden"
            >
              <button 
                onClick={() => handleFormat('checklist')} 
                className={`p-2.5 rounded-full transition-colors shrink-0 ${editor?.isActive('taskList') ? 'text-white bg-white/20' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleFormat('bold')} 
                className={`p-2.5 rounded-full transition-colors shrink-0 ${editor?.isActive('bold') ? 'text-white bg-white/20' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleFormat('italic')} 
                className={`p-2.5 rounded-full transition-colors shrink-0 ${editor?.isActive('italic') ? 'text-white bg-white/20' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleFormat('bullet')} 
                className={`p-2.5 rounded-full transition-colors shrink-0 ${editor?.isActive('bulletList') ? 'text-white bg-white/20' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-1 shrink-0" />
              <button 
                onClick={handleSave}
                disabled={isSaving || (!title.trim() && !content.trim()) || isContentUnchanged}
                className={`p-3 rounded-full transition-all shrink-0 ${saveStatus === 'success' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 hover:bg-amber-400/10 disabled:opacity-30'}`}
                title="Save Reflection"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveStatus === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-1 shrink-0" />
              <button onClick={() => { setIsFormattingExpanded(false); }} className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0">
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
               key="collapsed"
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0, opacity: 0 }}
               className="flex items-center gap-1"
            >
              <button
                onClick={toggleListening}
                className={`p-3 rounded-full transition-colors shrink-0 ${isListening ? 'text-amber-400 bg-amber-400/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                title="Voice Dictation"
              >
                <div className="relative">
                  <Mic className="w-4 h-4" />
                  {isListening && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />}
                </div>
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-1 shrink-0" />
              <button 
                onClick={handleSave}
                disabled={isSaving || (!title.trim() && !content.trim()) || isContentUnchanged}
                className={`p-3 rounded-full transition-all shrink-0 ${saveStatus === 'success' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 hover:bg-amber-400/10 disabled:opacity-30'}`}
                title="Save Reflection"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveStatus === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-1 shrink-0" />
              <button 
                onClick={() => setIsFormattingExpanded(true)}
                className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0"
              >
                <Type className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <SuccessMoment 
        isOpen={showSuccessMoment} 
        onClose={() => setShowSuccessMoment(false)}
        title={recentEntry?.processing_status === 'woven' ? (language === 'hi' ? 'Kahani buni gayi!' : 'Woven into LifeBook!') : (inspiredBy ? (language === 'hi' ? 'Kahani Prerit Ho Gayi!' : 'Story Inspired!') : (language === 'hi' ? 'Ehsaas Sanware Gaye!' : 'Feeling Captured!'))}
        subtitle={inspiredBy 
          ? (language === 'hi' ? `${inspirationAuthor} ke khayalon ne aapko nayi disha di.` : `A reflection shaped by ${inspirationAuthor}'s echoes.`)
          : (language === 'hi' ? 'Dhire dhire ye aapki dastan ban rahi hai.' : 'Every word adds a thread to your grand tapestry.')}
        type="save"
        onView={() => {
          setIsDrawerOpen(true); 
          useUIStore.getState().setActiveLibraryTab('echoes');
        }}
      />

      {/* Post-Save Actions - The Weaving Intentionality Bar */}
      <AnimatePresence>
        {saveStatus === 'success' && !showSuccessMoment && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
          >
            <div className="glass-surface border border-white/10 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4">
               <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Draft Saved</span>
                  <span className="text-xs text-white/80 font-serif italic">What next?</span>
               </div>
               
               <div className="flex items-center gap-2">
                 <button 
                  onClick={handleStartNewEntry}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all"
                 >
                   {language === 'hi' ? 'Bas' : 'Keep as Fragment'}
                 </button>
                 <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWeaveToStory}
                  disabled={isWeaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2"
                 >
                   {isWeaving ? (
                     <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                     <>
                      <Sparkles className="w-3 h-3" />
                      {language === 'hi' ? 'Bunn do' : 'Weave to Story'}
                     </>
                   )}
                 </motion.button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
