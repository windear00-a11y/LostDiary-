'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, Video, Camera, MapPin, Loader2, Plus, Check, ArrowUp, AudioLines, AlertCircle, Info, Trash2, Square, Feather } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useUIStore } from '@/lib/store/use-ui-store';

const UPLOAD_TIPS = {
  en: {
    dos: ["Use clear, high-quality images", "Keep videos under 30 seconds", "Send a text message after to explain the photo"],
    donts: ["Don't upload blurry or dark media", "Avoid large files (>10MB)", "Don't close the app during upload"]
  },
  hi: {
    dos: ["साफ और अच्छी क्वालिटी की फोटो का उपयोग करें", "वीडियो को 30 सेकंड से कम रखें", "फोटो के बाद उसे समझाने के लिए एक मैसेज भेजें"],
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

export const ChatInput = ({ onSendMessage, replyingTo, onClearReply }: { 
  onSendMessage: (msg: any) => Promise<void>,
  replyingTo?: any,
  onClearReply?: () => void
}) => {
  const { language } = useUIStore();
  const [text, setText] = useState('');
  const [caretCoords, setCaretCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'success'>('idle');
  
  const [lastTyped, setLastTyped] = useState(0);
  
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => updateCaretCoords();
    window.addEventListener('resize', handleResize);
    // Initial update
    if (isFocused) updateCaretCoords();
    return () => window.removeEventListener('resize', handleResize);
  }, [isFocused]);

  const handleSendText = async () => {
    if (!text.trim() || isUploading || sendState !== 'idle') return;
    
    setSendState('sending');
    try {
      await onSendMessage({ 
        type: 'text', 
        content: text,
        metadata: replyingTo ? { reply_to: replyingTo } : undefined
      });
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      if (onClearReply) onClearReply();
      
      setSendState('success');
      setTimeout(() => setSendState('idle'), 2000);
    } catch (error) {
      setSendState('idle');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
          
          setIsUploading(true);
          setUploadStatus(language === 'hi' ? 'ऑडियो भेजा जा रहा है...' : 'Sending audio...');
          try {
            await onSendMessage({ type: 'audio', content: audioFile });
            setUploadStatus(language === 'hi' ? 'पूरा हुआ!' : 'Complete!');
          } catch (error) {
            console.error('Error sending audio:', error);
          } finally {
            setTimeout(() => setIsUploading(false), 1000);
          }
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setShowActions(false);
    } catch (err) {
      console.error("Microphone access denied", err);
      setFileError(language === 'hi' ? 'माइक्रोफ़ोन की अनुमति नहीं है' : 'Microphone access denied');
      setTimeout(() => setFileError(null), 3000);
    }
  };

  const stopRecording = (cancel = false) => {
    if (cancel) {
      audioChunksRef.current = [];
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const shareLocation = () => {
    if (!navigator.geolocation) {
      setFileError(language === 'hi' ? 'लोकेशन सपोर्ट नहीं है' : 'Geolocation is not supported');
      setTimeout(() => setFileError(null), 3000);
      return;
    }

    setIsUploading(true);
    setUploadStatus(language === 'hi' ? 'लोकेशन प्राप्त की जा रही है...' : 'Getting location...');
    setShowActions(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await onSendMessage({
            type: 'location',
            content: `Shared a location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            metadata: { latitude, longitude }
          });
          setUploadStatus(language === 'hi' ? 'पूरा हुआ!' : 'Complete!');
        } catch (error) {
          console.error('Error sending location:', error);
          setFileError(language === 'hi' ? 'लोकेशन भेजने में विफल' : 'Failed to send location');
        } finally {
          setTimeout(() => setIsUploading(false), 1000);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setFileError(language === 'hi' ? 'लोकेशन प्राप्त करने में विफल' : 'Failed to get location');
        setIsUploading(false);
        setTimeout(() => setFileError(null), 3000);
      }
    );
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
    
    // Copy all relevant font styles for accurate measurement
    mirror.style.fontFamily = style.fontFamily;
    mirror.style.fontSize = style.fontSize;
    mirror.style.fontWeight = style.fontWeight;
    mirror.style.fontStyle = style.fontStyle;
    mirror.style.letterSpacing = style.letterSpacing;
    mirror.style.textTransform = style.textTransform;
    mirror.style.padding = style.padding;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.border = style.border;
    mirror.style.boxSizing = style.boxSizing;
    
    const content = textarea.value.substring(0, selectionStart);
    mirror.textContent = content;
    
    const marker = document.createElement('span');
    marker.textContent = '|';
    mirror.appendChild(marker);
    
    document.body.appendChild(mirror);
    const rect = marker.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    const parentRect = textarea.parentElement?.getBoundingClientRect();
    
    if (parentRect) {
      setCaretCoords({
        x: rect.left - parentRect.left,
        y: rect.top - parentRect.top
      });
    }
    
    document.body.removeChild(mirror);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setLastTyped(Date.now()); // Trigger bloom effect
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
    <div className="w-full p-2 md:p-4 z-40 bg-bg-light dark:bg-bg-dark">
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
              className="absolute bottom-14 left-0 bg-white dark:bg-[#1A1A1D] rounded-2xl p-3 shadow-2xl border border-gray-100 dark:border-white/5 grid grid-cols-4 gap-4 min-w-[260px]"
            >
              <button onClick={() => imageRef.current?.click()} className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                <ImageIcon className="w-5 h-5 text-accent" />
                <span className="text-[9px] font-medium text-gray-500">Photo</span>
              </button>
              <button onClick={startRecording} className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                <Mic className="w-5 h-5 text-accent" />
                <span className="text-[9px] font-medium text-gray-500">Voice</span>
              </button>
              <button onClick={() => cameraRef.current?.click()} className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                <Camera className="w-5 h-5 text-accent" />
                <span className="text-[9px] font-medium text-gray-500">Camera</span>
              </button>
              <button onClick={shareLocation} className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="text-[9px] font-medium text-gray-500">Location</span>
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

          {/* Reply Context UI */}
          <AnimatePresence>
            {replyingTo && (
              <motion.div 
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="absolute bottom-full left-12 right-0 mb-2 bg-white/90 dark:bg-[#1A1A1D]/90 backdrop-blur-md rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-white/5 flex items-start gap-3 overflow-hidden"
              >
                <div className="w-1 h-full absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-l-2xl" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                    Replying to {replyingTo.role === 'user' ? 'yourself' : 'WinDear'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate font-serif italic">
                    {replyingTo.content || 'Attachment'}
                  </p>
                </div>
                <button onClick={onClearReply} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Input Pill or Recording UI */}
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between bg-rose-50 dark:bg-rose-500/10 backdrop-blur-md p-1.5 px-4 rounded-full border border-rose-200 dark:border-rose-500/20 animate-pulse shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-600 dark:text-rose-400 font-mono font-medium">{formatTime(recordingTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => stopRecording(true)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={() => stopRecording(false)} className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors">
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 relative flex items-center gap-2 bg-white/85 dark:bg-black/80 backdrop-blur-md p-1.5 pl-4 rounded-full shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/40 dark:border-white/10 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
              {/* Debug Coords */}
              <div className="absolute -top-6 left-4 text-[8px] text-red-500 font-mono pointer-events-none z-50">
                X:{Math.round(caretCoords.x)} Y:{Math.round(caretCoords.y)}
              </div>
              {/* Magic Glow (Reactive Caret Follower) */}
              <AnimatePresence>
                {isFocused && (
                  <motion.div
                    key="magic-glow"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      left: caretCoords.x - 64, 
                      top: caretCoords.y - 64,
                      // Bloom effect on typing, otherwise soft pulse
                      scale: Date.now() - lastTyped < 100 ? [1.2, 1.3] : [1, 1.05, 1],
                      opacity: Date.now() - lastTyped < 100 ? 0.8 : [0.4, 0.6, 0.4],
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ 
                      left: { type: "spring", damping: 30, stiffness: 250, mass: 0.3 },
                      top: { type: "spring", damping: 30, stiffness: 250, mass: 0.3 },
                      scale: { duration: 0.2 },
                      opacity: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="absolute w-32 h-32 rounded-full bg-purple-600/50 blur-xl pointer-events-none z-20 border-2 border-purple-500"
                    style={{ mixBlendMode: 'normal' }}
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

              <div className="flex items-center gap-1 pr-1 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  {!text.trim() ? (
                    <motion.button 
                      key="mic"
                      initial={{ x: -10, opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                      animate={{ x: 0, opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
                      exit={{ x: 10, opacity: 0, clipPath: 'inset(0 0 0 100%)' }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startRecording} 
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg bg-gradient-to-tr from-emerald-400 to-emerald-500 text-white"
                    >
                      <Mic className="w-5 h-5" />
                    </motion.button>
                  ) : (
                    <motion.button 
                      key="send"
                      initial={{ x: -10, opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                      animate={{ x: 0, opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
                      exit={{ x: 10, opacity: 0, clipPath: 'inset(0 0 0 100%)' }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
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
                            <Feather className="w-4 h-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

