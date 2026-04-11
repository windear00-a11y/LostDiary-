'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, Video, Camera, MapPin, Loader2, Plus, Check, ArrowUp, AudioLines, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useUIStore } from '@/lib/store/use-ui-store';

const UPLOAD_TIPS = {
  en: {
    dos: ["Use clear, high-quality images", "Keep videos under 30 seconds", "Add a caption for context"],
    donts: ["Don't upload blurry or dark media", "Avoid large files (>10MB)", "Don't close the app during upload"]
  },
  hi: {
    dos: ["साफ और अच्छी क्वालिटी की फोटो का उपयोग करें", "वीडियो को 30 सेकंड से कम रखें", "संदर्भ के लिए कैप्शन जोड़ें"],
    donts: ["धुंधली या अंधेरी फोटो अपलोड न करें", "बड़ी फाइलों (>10MB) से बचें", "अपलोड के दौरान ऐप बंद न करें"]
  }
};

const PLACEHOLDERS: Record<string, string> = {
  en: "Write your story...",
  hi: "अपनी कहानी लिखें...",
  es: "Escribe tu historia...",
  fr: "Écrivez votre histoire...",
  de: "Schreibe deine Geschichte...",
  ja: "あなたの物語を書いてください...",
  ko: "당신의 이야기를 써보세요...",
  zh: "写下你的故事...",
  ar: "اكتب قصتك...",
  ru: "Напишите свою историю...",
  pt: "Escreva sua história...",
  it: "Scrivi la tua storia...",
  tr: "Hikayeni yaz...",
  vi: "Viết câu chuyện của bạn...",
  th: "เขียนเรื่องราวของคุณ...",
  id: "Tulis ceritamu...",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ChatInput = ({ onSendMessage }: { onSendMessage: (msg: any) => Promise<void> }) => {
  const { language } = useUIStore();
  const [text, setText] = useState('');
  const [caretCoords, setCaretCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'success'>('idle');
  
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendText = async () => {
    if (!text.trim() || isUploading || sendState !== 'idle') return;
    
    setSendState('sending');
    try {
      await onSendMessage({ type: 'text', content: text });
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      
      setSendState('success');
      setTimeout(() => setSendState('idle'), 2000);
    } catch (error) {
      setSendState('idle');
    }
  };

  const updateCaretCoords = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const { selectionStart } = textarea;
    
    // Create mirror div to calculate coordinates
    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.width = `${textarea.clientWidth}px`;
    mirror.style.font = style.font;
    mirror.style.padding = style.padding;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.border = style.border;
    
    const content = textarea.value.substring(0, selectionStart);
    mirror.textContent = content;
    
    const marker = document.createElement('span');
    marker.textContent = '|';
    mirror.appendChild(marker);
    
    document.body.appendChild(mirror);
    const rect = marker.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    
    setCaretCoords({
      x: rect.left - textareaRect.left,
      y: rect.top - textareaRect.top
    });
    
    document.body.removeChild(mirror);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    setTimeout(updateCaretCoords, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (10MB limit)
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = language === 'hi' 
        ? 'फ़ाइल बहुत बड़ी है! कृपया 10MB से कम की फ़ाइल चुनें।' 
        : 'File is too large! Please select a file under 10MB.';
      setFileError(errorMsg);
      setTimeout(() => setFileError(null), 4000);
      if (e.target) e.target.value = '';
      return;
    }

    try {
      setIsUploading(true);
      setFileError(null);
      setUploadStatus(language === 'hi' ? 'तैयार हो रहा है...' : 'Preparing...');
      setShowActions(false);
      
      // Simulate progress stages
      setTimeout(() => setUploadStatus(language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...'), 800);
      
      await onSendMessage({ type, content: file });
      
      setUploadStatus(language === 'hi' ? 'पूरा हुआ!' : 'Complete!');
      setTimeout(() => setIsUploading(false), 1000);
    } catch (error) {
      console.error(`Error sending ${type}:`, error);
      setIsUploading(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-2 md:p-3 z-40">
      <div className="max-w-3xl mx-auto relative">
        {/* File Error Message */}
        <AnimatePresence>
          {fileError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 left-0 right-0 flex justify-center z-50 pointer-events-none"
            >
              <div className="bg-rose-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {fileError}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress & Tips */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 right-4 bg-white/95 dark:bg-[#1A1A1D]/95 backdrop-blur-xl rounded-[32px] p-6 shadow-2xl border border-indigo-100 dark:border-white/10 z-50"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-gray-900 dark:text-gray-100">{uploadStatus}</h4>
                  <div className="w-48 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">
                    <Check className="w-4 h-4" />
                    {language === 'hi' ? 'क्या करें (Do\'s)' : 'Do\'s'}
                  </div>
                  <ul className="space-y-2">
                    {(UPLOAD_TIPS[language as keyof typeof UPLOAD_TIPS] || UPLOAD_TIPS.en).dos.map((tip, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-widest">
                    <AlertCircle className="w-4 h-4" />
                    {language === 'hi' ? 'क्या न करें (Don\'ts)' : 'Don\'ts'}
                  </div>
                  <ul className="space-y-2">
                    {(UPLOAD_TIPS[language as keyof typeof UPLOAD_TIPS] || UPLOAD_TIPS.en).donts.map((tip, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Attachment Bottom Sheet (Simplified as a floating menu for now) */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-14 left-0 bg-white dark:bg-[#1A1A1D] rounded-2xl p-3 shadow-2xl border border-gray-100 dark:border-white/5 grid grid-cols-3 gap-4 min-w-[200px]"
            >
              <button onClick={() => imageRef.current?.click()} className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                <ImageIcon className="w-5 h-5 text-accent" />
                <span className="text-[9px] font-medium text-gray-500">Photo</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                <Mic className="w-5 h-5 text-accent" />
                <span className="text-[9px] font-medium text-gray-500">Voice</span>
              </button>
              <button onClick={() => cameraRef.current?.click()} className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                <Camera className="w-5 h-5 text-accent" />
                <span className="text-[9px] font-medium text-gray-500">Camera</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-center gap-3">
          <input type="file" accept="image/*" className="hidden" ref={imageRef} onChange={(e) => handleFileUpload(e, 'image')} />
          <input type="file" accept="video/*" className="hidden" ref={videoRef} onChange={(e) => handleFileUpload(e, 'video')} />
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraRef} onChange={(e) => handleFileUpload(e, 'image')} />

          {/* External Plus Button */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowActions(!showActions)}
            className="w-12 h-12 rounded-full bg-white/85 dark:bg-black/80 backdrop-blur-md shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/40 dark:border-white/10 flex items-center justify-center shrink-0 transition-all text-gray-500 dark:text-gray-400"
          >
            <Plus className={`w-6 h-6 transition-transform duration-300 ${showActions ? 'rotate-45' : ''}`} />
          </motion.button>

          {/* Main Input Pill */}
          <div className="flex-1 relative flex items-center gap-2 bg-white/85 dark:bg-black/80 backdrop-blur-md p-1.5 pl-4 rounded-full shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/40 dark:border-white/10 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden">
            {/* Magic Glow */}
            <AnimatePresence>
              {isFocused && text.length > 0 && (
                <motion.div
                  animate={{ 
                    left: caretCoords.x - 20, 
                    top: caretCoords.y - 10,
                  }}
                  transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
                  className="absolute w-12 h-12 rounded-full bg-indigo-500/20 blur-xl pointer-events-none z-0"
                  style={{ mixBlendMode: 'screen' }}
                />
              )}
            </AnimatePresence>

            <textarea 
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                setTimeout(updateCaretCoords, 0);
              }}
              onBlur={() => setIsFocused(false)}
              onClick={updateCaretCoords}
              onKeyUp={updateCaretCoords}
              rows={1}
              className="flex-1 py-2 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none max-h-32 overflow-y-auto font-serif italic text-sm md:text-base custom-caret z-10 relative"
              placeholder={PLACEHOLDERS[language] || PLACEHOLDERS.en}
            />

            <div className="flex items-center gap-1 pr-1">
              <button className="p-2 text-gray-400 hover:text-accent transition-colors">
                <Mic className="w-5 h-5" />
              </button>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendText} 
                disabled={!text.trim() || isUploading || sendState !== 'idle'}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg ${
                  sendState === 'success' 
                    ? 'bg-gradient-to-tr from-emerald-400 to-emerald-500' 
                    : 'bg-gradient-to-tr from-[#8B85FF] to-[#A5A0FF]'
                } text-white disabled:opacity-30`}
              >
                <AnimatePresence mode="wait">
                  {sendState === 'sending' ? (
                    <motion.div 
                      key="sending" 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </motion.div>
                  ) : sendState === 'success' ? (
                    <motion.div 
                      key="success" 
                      initial={{ opacity: 0, scale: 0.5, rotate: -45 }} 
                      animate={{ opacity: 1, scale: 1, rotate: 0 }} 
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="idle" 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

