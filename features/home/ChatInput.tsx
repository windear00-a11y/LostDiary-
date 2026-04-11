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
    <div className="fixed bottom-0 left-0 right-0 p-6 z-40">
      <div className="max-w-3xl mx-auto relative">
        {/* Attachment Bottom Sheet (Simplified as a floating menu for now) */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 left-0 bg-white dark:bg-[#1A1A1D] rounded-3xl p-4 shadow-2xl border border-gray-100 dark:border-white/5 grid grid-cols-3 gap-4 min-w-[240px]"
            >
              <button onClick={() => imageRef.current?.click()} className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors">
                <ImageIcon className="w-6 h-6 text-accent" />
                <span className="text-[10px] font-medium text-gray-500">Photo</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors">
                <Mic className="w-6 h-6 text-accent" />
                <span className="text-[10px] font-medium text-gray-500">Voice</span>
              </button>
              <button onClick={() => cameraRef.current?.click()} className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors">
                <Camera className="w-6 h-6 text-accent" />
                <span className="text-[10px] font-medium text-gray-500">Camera</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end gap-2 bg-white dark:bg-[#1A1A1D] p-2 pl-4 rounded-[32px] premium-shadow border border-gray-100 dark:border-white/5 transition-all focus-within:ring-2 focus-within:ring-accent/20">
          <input type="file" accept="image/*" className="hidden" ref={imageRef} onChange={(e) => handleFileUpload(e, 'image')} />
          <input type="file" accept="video/*" className="hidden" ref={videoRef} onChange={(e) => handleFileUpload(e, 'video')} />
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraRef} onChange={(e) => handleFileUpload(e, 'image')} />

          <button 
            onClick={() => setShowActions(!showActions)}
            className="p-3 text-gray-400 hover:text-accent transition-colors shrink-0"
          >
            <Plus className={`w-6 h-6 transition-transform duration-300 ${showActions ? 'rotate-45' : ''}`} />
          </button>

          <textarea 
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 py-3 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none max-h-32 overflow-y-auto font-medium"
            placeholder="Type your moment..."
          />

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSendText} 
            disabled={!text.trim() || isUploading || sendState !== 'idle'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 ${
              sendState === 'success' ? 'bg-emerald-500' : 'bg-accent'
            } text-white disabled:opacity-30`}
          >
            <AnimatePresence mode="wait">
              {sendState === 'sending' ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 className="w-5 h-5 animate-spin" />
                </motion.div>
              ) : sendState === 'success' ? (
                <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ArrowUp className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

