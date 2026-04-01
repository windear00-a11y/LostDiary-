'use client';
import { Sparkles, Loader2, Info, Mic, MicOff } from 'lucide-react';
import { RefObject, useState, useEffect, useCallback } from 'react';
import { checkSpelling } from '@/lib/ai';
import { motion, AnimatePresence } from 'motion/react';

export function DiaryInput({
  newEntry,
  setNewEntry,
  handleSubmit,
  isSubmitting,
  submitError,
  t,
  textareaRef
}: {
  newEntry: string;
  setNewEntry: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  t: (key: string) => string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [spellingSuggestion, setSpellingSuggestion] = useState<{ suggestion: string, explanation: string } | null>(null);
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  const [isQuery, setIsQuery] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

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
    const queryPatterns = [
      /^(how|what|when|where|why|who|can|do|did|is|are|was|were|tell|show|recall|analyze|patterns|insights|kya|kab|kaise|kyun|kaun|kahan)\b/i, 
      /\?$/,
      /\b(yaad|pucho|batao|analysis|pattern)\b/i
    ];
    setIsQuery(queryPatterns.some(p => p.test(newEntry.trim())));
  }, [newEntry]);

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

  return (
    <section className="bg-white dark:bg-[#1A1A1A] p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-lg shadow-indigo-50/50 dark:shadow-none border border-slate-100 dark:border-[#2E2E2E] space-y-6 transition-colors duration-300">
      {submitError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl text-red-600 dark:text-red-400 text-sm">
          <p className="font-bold mb-1">Error saving entry:</p>
          <p>{submitError}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
            <textarea
              ref={textareaRef}
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder={t('dash.placeholder')}
              className="w-full min-h-[240px] pt-6 px-6 pb-20 bg-gray-50 dark:bg-[#262626] border-none rounded-[2.5rem] text-base focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-[#111827] dark:text-[#F9FAFB]"
            />
            
            <AnimatePresence>
              {spellingSuggestion && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-2xl flex items-start gap-3 group"
                >
                  <div className="p-2 bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm shrink-0">
                    <Info className="w-4 h-4 text-[#6366F1]" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-bold text-[#6366F1] uppercase tracking-widest">
                      Did you mean?
                    </p>
                    <p className="text-sm text-[#374151] dark:text-[#D1D5DB] leading-relaxed">
                      {spellingSuggestion.suggestion}
                    </p>
                    {spellingSuggestion.explanation && (
                      <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] italic">
                        {spellingSuggestion.explanation}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setNewEntry(spellingSuggestion.suggestion);
                        setSpellingSuggestion(null);
                      }}
                      className="mt-2 text-xs font-semibold text-[#6366F1] hover:text-[#4F46E5] transition-colors"
                    >
                      Apply correction
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Integrated Action Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              {/* Left side: Status */}
              <div className="flex items-center gap-2 bg-white/80 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 dark:border-white/10 pointer-events-auto shadow-sm">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : newEntry.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">
                  {isListening ? "Listening..." : newEntry.length > 0 ? t('dash.writingMood') : t('dash.readyToListen')}
                </span>
              </div>

              {/* Right side: Mic & Chars */}
              <div className="flex items-center gap-3 pointer-events-auto">
                <span className="hidden sm:block text-[10px] uppercase tracking-widest font-bold text-gray-400 bg-white/80 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 dark:border-white/10 shadow-sm">
                  {newEntry.length} {t('dash.chars')}
                </span>
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
                  title={isListening ? "Stop listening" : "Hold to record"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newEntry.trim()}
            className="group flex items-center gap-3 bg-slate-900 dark:bg-[#F9FAFB] text-white dark:text-[#0A0A0A] px-10 py-5 rounded-full text-base font-semibold hover:bg-slate-800 dark:hover:bg-white transition-all duration-300 hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('dash.reflecting')}
              </>
            ) : (
              <>
                {isQuery ? 'Ask WinDear' : t('dash.save')}
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
