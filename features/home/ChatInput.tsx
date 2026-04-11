'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, Video, Camera, MapPin, Loader2, Plus, Check, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ChatInput = ({ onSendMessage }: { onSendMessage: (msg: any) => Promise<void> }) => {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
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

    try {
      setIsUploading(true);
      setShowActions(false);
      await onSendMessage({ type, content: file });
    } catch (error) {
      console.error(`Error sending ${type}:`, error);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 md:p-4 z-40">
      <div className="max-w-3xl mx-auto relative">
        {/* Attachment Bottom Sheet (Simplified as a floating menu for now) */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-16 left-0 bg-white dark:bg-[#1A1A1D] rounded-2xl p-3 shadow-2xl border border-gray-100 dark:border-white/5 grid grid-cols-3 gap-4 min-w-[200px]"
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

        <div className="relative flex items-end gap-2 bg-white dark:bg-[#1A1A1D] p-1.5 pl-3 rounded-[28px] premium-shadow border border-gray-100 dark:border-white/5 transition-all focus-within:ring-2 focus-within:ring-accent/20">
          <input type="file" accept="image/*" className="hidden" ref={imageRef} onChange={(e) => handleFileUpload(e, 'image')} />
          <input type="file" accept="video/*" className="hidden" ref={videoRef} onChange={(e) => handleFileUpload(e, 'video')} />
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraRef} onChange={(e) => handleFileUpload(e, 'image')} />

          <button 
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-400 hover:text-accent transition-colors shrink-0"
          >
            <Plus className={`w-5 h-5 transition-transform duration-300 ${showActions ? 'rotate-45' : ''}`} />
          </button>

          <textarea 
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 py-2 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none max-h-32 overflow-y-auto font-medium text-sm md:text-base"
            placeholder="Type your moment..."
          />

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendText} 
            disabled={!text.trim() || isUploading || sendState !== 'idle'}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg ${
              sendState === 'success' 
                ? 'bg-emerald-500' 
                : 'bg-gradient-to-tr from-accent to-[#8B85FF]'
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
                  transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
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
  );
};

