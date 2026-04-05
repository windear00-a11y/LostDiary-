'use client';
import { Sparkles, Loader2, Info, Mic, MicOff, Languages, Lightbulb, Image as ImageIcon, Link as LinkIcon, X as XIcon, Upload, Bold, Italic, List, ListOrdered, Type as TypeIcon, HelpCircle, Wand2, ArrowRight, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import React, { RefObject, useState, useEffect, useCallback } from 'react';
import { checkSpelling, generateInlineSuggestions } from '@/lib/ai';
import { motion, AnimatePresence } from 'motion/react';

import { useDiaryStore, useEntries } from '@/lib/store/use-diary-store';
import { useUIState } from '@/lib/store/use-ui-store';

export const DiaryInput = React.memo(function DiaryInput({
  newEntry,
  setNewEntry,
  handleSubmit,
  isSubmitting,
  submitError,
  t,
  textareaRef,
  showSuccess,
  imageUrl,
  setImageUrl
}: {
  newEntry: string;
  setNewEntry: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  t: (key: string) => string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  showSuccess: boolean;
  imageUrl: string;
  setImageUrl: React.Dispatch<React.SetStateAction<string>>;
}) {
  const entries = useEntries();
  const { showTranslated, setShowTranslated } = useUIState();
  const [spellingSuggestion, setSpellingSuggestion] = useState<{ suggestion: string, explanation: string } | null>(null);
  const [inlineSuggestion, setInlineSuggestion] = useState<string | null>(null);
  const [suggestionType, setSuggestionType] = useState<'improve' | 'continue' | 'rephrase'>('improve');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [mood, setMood] = useState<'happy' | 'sad' | 'angry' | 'anxious' | 'calm' | 'neutral'>('neutral');
  const [isIntense, setIsIntense] = useState(false);

  // Mood detection and transition logic
  useEffect(() => {
    const text = newEntry.toLowerCase();
    let detectedMood: 'happy' | 'sad' | 'angry' | 'anxious' | 'calm' | 'neutral' = 'neutral';

    if (text.includes('happy') || text.includes('great') || text.includes('love') || text.includes('khush') || text.includes('mazza') || text.includes('awesome') || text.includes('acha')) {
      detectedMood = 'happy';
    } else if (text.includes('sad') || text.includes('lonely') || text.includes('cry') || text.includes('dukh') || text.includes('udaas') || text.includes('dard') || text.includes('broken')) {
      detectedMood = 'sad';
    } else if (text.includes('angry') || text.includes('hate') || text.includes('gussa') || text.includes('irritated') || text.includes('chidh')) {
      detectedMood = 'angry';
    } else if (text.includes('anxious') || text.includes('worried') || text.includes('scared') || text.includes('dar') || text.includes('tension') || text.includes('panic')) {
      detectedMood = 'anxious';
    } else if (text.includes('calm') || text.includes('peace') || text.includes('shanti') || text.includes('sukoon') || text.includes('relax')) {
      detectedMood = 'calm';
    }

    if (detectedMood !== mood && detectedMood !== 'neutral') {
      setMood(detectedMood);
      setIsIntense(true);
      
      // Transition to balanced state after 2 seconds
      const timer = setTimeout(() => {
        setIsIntense(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else if (newEntry.length === 0) {
      setMood('neutral');
      setIsIntense(false);
    }
  }, [newEntry, mood]);

  // Inline AI Suggestions Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = newEntry.trim();
      if (trimmed.length > 15 && !inlineSuggestion) {
        setIsGeneratingSuggestion(true);
        const suggestion = await generateInlineSuggestions(trimmed, suggestionType);
        setInlineSuggestion(suggestion);
        setIsGeneratingSuggestion(false);
      }
    }, 3000); // Trigger after 3 seconds of inactivity

    return () => clearTimeout(timer);
  }, [newEntry, suggestionType, inlineSuggestion]);

  // Clear suggestion when typing starts again or entry is cleared
  useEffect(() => {
    if (newEntry.length === 0) {
      setInlineSuggestion(null);
    }
  }, [newEntry]);

  const handleApplySuggestion = () => {
    if (!inlineSuggestion) return;
    if (suggestionType === 'continue') {
      setNewEntry(prev => prev.trim() + ' ' + inlineSuggestion);
    } else {
      setNewEntry(inlineSuggestion);
    }
    setInlineSuggestion(null);
  };

  const cycleSuggestionType = () => {
    const types: ('improve' | 'continue' | 'rephrase')[] = ['improve', 'continue', 'rephrase'];
    const currentIndex = types.indexOf(suggestionType);
    const nextIndex = (currentIndex + 1) % types.length;
    setSuggestionType(types[nextIndex]);
    setInlineSuggestion(null); // Reset to trigger new one
  };

  const getMoodStyles = () => {
    const base = "transition-all duration-[3000ms] ease-out";
    
    switch (mood) {
      case 'happy':
        return isIntense 
          ? "border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.4)] dark:shadow-[0_0_60px_rgba(250,204,21,0.2)]" 
          : "border-orange-200/50 shadow-[0_0_20px_rgba(251,146,60,0.1)] dark:border-orange-900/20";
      case 'sad':
        return isIntense 
          ? "border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)] dark:shadow-[0_0_60px_rgba(59,130,246,0.2)]" 
          : "border-indigo-100 shadow-[0_0_20px_rgba(165,180,252,0.1)] dark:border-indigo-900/20";
      case 'angry':
        return isIntense 
          ? "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] dark:shadow-[0_0_60px_rgba(239,68,68,0.2)]" 
          : "border-blue-100 shadow-[0_0_20px_rgba(191,219,254,0.1)] dark:border-blue-900/20";
      case 'anxious':
        return isIntense 
          ? "border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.4)] dark:shadow-[0_0_60px_rgba(168,85,247,0.2)]" 
          : "border-pink-100 shadow-[0_0_20px_rgba(252,231,243,0.1)] dark:border-pink-900/20";
      case 'calm':
        return isIntense 
          ? "border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.3)] dark:shadow-[0_0_60px_rgba(52,211,153,0.1)]" 
          : "border-teal-100 shadow-[0_0_20px_rgba(204,251,241,0.1)] dark:border-teal-900/20";
      default:
        return "border-slate-100 dark:border-[#2E2E2E] shadow-indigo-100/30";
    }
  };

  const getPulseColor = () => {
    switch (mood) {
      case 'happy': return 'bg-yellow-400';
      case 'sad': return 'bg-blue-400';
      case 'angry': return 'bg-red-400';
      case 'anxious': return 'bg-purple-400';
      case 'calm': return 'bg-emerald-400';
      default: return 'bg-indigo-400';
    }
  };

  const handleGetPrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      const { generateDailyPrompt } = await import('@/lib/ai');
      const prompt = await generateDailyPrompt(entries);
      setNewEntry(prompt);
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Prompt error:', error);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleTranslateEntry = async () => {
    if (!newEntry.trim()) return;
    setIsTranslating(true);
    try {
      const { translateText } = await import('@/lib/ai');
      const translated = await translateText(newEntry, 'en');
      if (translated && translated !== newEntry) {
        setNewEntry(translated);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const startListening = useCallback(() => {
    if (isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setNewEntry((prev: string) => prev + (prev.length > 0 ? ' ' : '') + finalTranscript);
      }
    };

    try {
      rec.start();
      setRecognition(rec);
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [isListening, setNewEntry]);

  const stopListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      setRecognition(null);
    }
    setIsListening(false);
  }, [recognition]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    // Auto-focus when mounted
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [textareaRef]); // Run only on mount

  useEffect(() => {
    // Auto-scroll textarea to bottom when typing
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const isAtBottom = textarea.scrollHeight - textarea.scrollTop <= textarea.clientHeight + 100;
      if (isAtBottom) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    }
  }, [newEntry, textareaRef]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newEntry.trim().length > 20) {
        setIsCheckingSpelling(true);
        const result = await checkSpelling(newEntry);
        setSpellingSuggestion(result);
        setIsCheckingSpelling(false);
      } else {
        setSpellingSuggestion(null);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [newEntry]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;
    setNewEntry(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <section className={`p-4 sm:p-10 rounded-2xl sm:rounded-3xl border bg-white dark:bg-[#1A1A1A] relative overflow-hidden backdrop-blur-sm ${getMoodStyles()}`}>
      {/* Background Glow Effect */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-[3000ms] ease-out ${
        mood === 'happy' ? (isIntense ? 'bg-yellow-400/5' : 'bg-orange-400/2') :
        mood === 'sad' ? (isIntense ? 'bg-blue-400/5' : 'bg-indigo-400/2') :
        mood === 'angry' ? (isIntense ? 'bg-red-400/5' : 'bg-blue-400/2') :
        mood === 'anxious' ? (isIntense ? 'bg-purple-400/5' : 'bg-pink-400/2') :
        mood === 'calm' ? (isIntense ? 'bg-emerald-400/5' : 'bg-teal-400/2') :
        'bg-transparent'
      }`} />

      {/* Living Pulse Indicator */}
      <div className="flex justify-center -mt-6 mb-2 relative z-10">
        <motion.div 
          animate={newEntry.length > 0 ? {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          } : { scale: 1, opacity: 0.2 }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className={`w-2 h-2 rounded-full ${getPulseColor()}`}
        />
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl text-red-600 dark:text-red-400 text-sm">
          <p className="font-bold mb-1">Error saving entry:</p>
          <p>{submitError}</p>
        </div>
      )}

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-2xl text-green-600 dark:text-green-400 text-sm flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-white dark:bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-sm border border-green-100 dark:border-green-900/20">
              <Sparkles className="w-4 h-4 text-green-500" />
            </div>
            <p className="font-medium">Entry saved successfully! Your memory is safe with WinDear.</p>
          </motion.div>
        )}
      </AnimatePresence>
      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence>
          {showImageInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-gray-50 dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-3 h-3 text-indigo-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Add a Memory</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowImageInput(false)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <XIcon className="w-3 h-3 text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer bg-white dark:bg-[#1A1A1A] group">
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 uppercase tracking-widest">Upload Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-2">
                      <LinkIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Or paste URL</span>
                    </div>
                    <input 
                      type="url"
                      value={imageUrl.startsWith('data:') ? '' : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl py-2 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {imageUrl && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-[#2E2E2E]">
                    <Image 
                      src={imageUrl} 
                      alt="Preview" 
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#262626] p-1 rounded-full border border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => insertMarkdown('**', '**')}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all text-gray-500 hover:text-indigo-600"
                title="Bold (**text**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('*', '*')}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all text-gray-500 hover:text-indigo-600"
                title="Italic (*text*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('\n- ', '')}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all text-gray-500 hover:text-indigo-600"
                title="Bullet List (- item)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('\n1. ', '')}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all text-gray-500 hover:text-indigo-600"
                title="Numbered List (1. item)"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('[', '](url)')}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all text-gray-500 hover:text-indigo-600"
                title="Link ([text](url))"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-800 mx-1" />
              <button
                type="button"
                onClick={() => {
                  alert("Markdown Guide:\n\n**Bold** -> **text**\n*Italic* -> *text*\nList -> - item\nNumbered -> 1. item\nLink -> [text](url)");
                }}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all text-gray-400 hover:text-indigo-600"
                title="Markdown Guide"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-800 mx-1" />

            <button
              type="button"
              onClick={() => setShowTranslated(!showTranslated)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 border ${showTranslated ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white dark:bg-[#262626] text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/30 hover:bg-indigo-50'}`}
              title="Toggle English translation for all entries"
            >
              <Languages className="w-3 h-3" />
              {showTranslated ? 'English View' : 'Original View'}
            </button>

            <button
              type="button"
              onClick={handleGetPrompt}
              disabled={isGeneratingPrompt}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 border bg-white dark:bg-[#262626] text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/30 hover:bg-indigo-50 disabled:opacity-50"
              title="Get a personalized writing prompt"
            >
              {isGeneratingPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
              Need a prompt?
            </button>
            
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 border ${imageUrl ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-200' : 'bg-white dark:bg-[#262626] text-gray-600 dark:text-gray-400 border-gray-100 dark:border-indigo-800/30 hover:bg-gray-50'}`}
              title="Add an image URL to this entry"
            >
              <ImageIcon className="w-3 h-3" />
              {imageUrl ? 'Image Added' : 'Add Image'}
            </button>

            <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-800 mx-2" />

            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 whitespace-nowrap mr-2">
              {t('dash.prompts')}
            </span>
            {[
              { id: 'gratitude', label: t('dash.prompt.gratitude'), text: t('dash.prompt.gratitude.text') },
              { id: 'goals', label: t('dash.prompt.goals'), text: t('dash.prompt.goals.text') },
              { id: 'reflection', label: t('dash.prompt.reflection'), text: t('dash.prompt.reflection.text') },
            ].map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => {
                  const templateText = prompt.text;
                  if (!newEntry.trim()) {
                    setNewEntry(templateText);
                  } else {
                    setNewEntry(newEntry + "\n\n" + templateText);
                  }
                  textareaRef.current?.focus();
                }}
                className="px-4 py-2 bg-gray-50 dark:bg-[#262626] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 transition-all whitespace-nowrap border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800/30 active:scale-95"
              >
                {prompt.label}
              </button>
            ))}
          </div>
          <div className="relative group/input">
            <AnimatePresence>
              {spellingSuggestion && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-2xl flex items-start gap-3 group"
                >
                  <div className="p-2 bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm shrink-0">
                    <Info className="w-4 h-4 text-[#6366F1]" aria-hidden="true" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#6366F1] uppercase tracking-widest">
                        Did you mean?
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewEntry(spellingSuggestion.suggestion);
                          setSpellingSuggestion(null);
                        }}
                        aria-label="Apply spelling correction"
                        className="text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] transition-colors bg-white dark:bg-[#1A1A1A] px-3 py-1 rounded-full shadow-sm border border-indigo-100 dark:border-indigo-800/30"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-sm text-[#374151] dark:text-[#D1D5DB] leading-relaxed">
                      {spellingSuggestion.suggestion}
                    </p>
                    {spellingSuggestion.explanation && (
                      <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] italic">
                        {spellingSuggestion.explanation}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Inline AI Suggestions Tooltip */}
              {(inlineSuggestion || isGeneratingSuggestion) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-32 left-6 right-6 z-20 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border border-indigo-100 dark:border-indigo-900/30 rounded-2xl shadow-xl p-3 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-500 rounded-lg text-white">
                        <Wand2 className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                        AI {suggestionType === 'improve' ? 'Improvement' : suggestionType === 'continue' ? 'Continuation' : 'Rephrase'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={cycleSuggestionType}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                        title="Change suggestion type"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineSuggestion(null)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {isGeneratingSuggestion ? (
                    <div className="flex items-center gap-2 py-2 px-1">
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                      <span className="text-xs text-gray-400 italic">WinDear is thinking...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                        {inlineSuggestion}
                      </p>
                      <button
                        type="button"
                        onClick={handleApplySuggestion}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-indigo-200 dark:shadow-none"
                      >
                        Apply Suggestion
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              ref={textareaRef}
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder={t('dash.placeholder')}
              aria-label={t('dash.placeholder')}
              className={`w-full min-h-[240px] pt-6 px-6 pb-32 sm:pb-20 border-none rounded-[2.5rem] text-base focus:ring-2 transition-all outline-none resize-none text-[#111827] dark:text-[#F9FAFB] bg-gray-50 dark:bg-[#262626] focus:ring-indigo-100 dark:focus:ring-indigo-900/30 placeholder:text-gray-400 dark:placeholder:text-gray-600`}
            />

            {/* Integrated Action Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center sm:justify-between gap-3 pointer-events-none">
              {/* Left side: Status */}
              <div className="flex items-center gap-2 bg-white/80 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 dark:border-white/10 pointer-events-auto shadow-sm">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : newEntry.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">
                  {isListening ? "Listening..." : newEntry.length > 0 ? t('dash.writingMood') : t('dash.readyToListen')}
                </span>
              </div>

              {/* Right side: Mic & Chars & Translate */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-3 pointer-events-auto">
                <div className="flex items-center gap-2">
                  {newEntry.length > 5 && (
                    <button
                      type="button"
                      onClick={handleTranslateEntry}
                      disabled={isTranslating}
                      className="p-2 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-full border border-gray-100 dark:border-white/10 shadow-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50"
                      title="Translate current text to English"
                    >
                      {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                    </button>
                  )}
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 bg-white/80 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 dark:border-white/10 shadow-sm">
                    {newEntry.length} {t('dash.chars')}
                  </span>
                </div>
                <motion.button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    startListening();
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    stopListening();
                  }}
                  onPointerLeave={(e) => {
                    e.preventDefault();
                    stopListening();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    // Toggle for accessibility/tap users
                    toggleListening();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isListening ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 0 0px rgba(239, 68, 68, 0.4)",
                      "0 0 0 15px rgba(239, 68, 68, 0)",
                      "0 0 0 0px rgba(239, 68, 68, 0)"
                    ]
                  } : {}}
                  transition={isListening ? {
                    scale: { repeat: Infinity, duration: 1 },
                    boxShadow: { repeat: Infinity, duration: 1.5 }
                  } : {}}
                  className={`p-4 rounded-full transition-all shadow-lg ${
                    isListening 
                      ? 'bg-red-500 text-white' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                  }`}
                  aria-label={isListening ? "Stop listening" : "Hold to record"}
                  title={isListening ? "Stop listening" : "Hold to record"}
                >
                  {isListening ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || (!newEntry.trim() && !showSuccess)}
            aria-label={isSubmitting ? t('dash.reflecting') : (showSuccess ? 'Saved!' : t('dash.save'))}
            className={`group flex items-center gap-3 px-10 py-5 rounded-full text-base font-semibold transition-all duration-300 hover:shadow-lg active:scale-95 disabled:opacity-50 ${showSuccess ? 'bg-green-500 text-white' : 'bg-slate-900 dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] hover:bg-slate-800 dark:hover:bg-white'}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                {t('dash.reflecting')}
              </>
            ) : showSuccess ? (
              <>
                Saved!
                <Sparkles className="w-5 h-5 animate-bounce" aria-hidden="true" />
              </>
            ) : (
              <>
                {t('dash.save')}
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
});
