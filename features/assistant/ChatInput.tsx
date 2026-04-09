'use client';

import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Mic, Video, Camera, MapPin, Loader2, Square, Plus } from 'lucide-react';
import { chatService } from '@/lib/services/chat-service';
import { authService } from '@/lib/services/auth-service';

export const ChatInput = ({ onSendMessage }: { onSendMessage: (msg: any) => Promise<void> }) => {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendText = async () => {
    if (!text.trim() || isUploading) return;
    await onSendMessage({ type: 'text', content: text });
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter will now naturally create a new line in the textarea
    // No preventDefault() or handleSendText() here
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await onSendMessage({ type, content: file });
    } catch (error) {
      console.error(`Error sending ${type}:`, error);
      alert(`Failed to send ${type}`);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = ''; // reset input
    }
  };

  const handleLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsUploading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await onSendMessage({ 
            type: 'location', 
            content: `📍 Shared location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 
            metadata: { latitude, longitude } 
          });
        } catch (error) {
          console.error("Error sending location:", error);
          alert("Failed to send location");
        } finally {
          setIsUploading(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Failed to get location");
        setIsUploading(false);
      }
    );
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
          
          try {
            setIsUploading(true);
            await onSendMessage({ type: 'audio', content: file });
          } catch (error) {
            console.error("Error sending audio:", error);
            alert("Failed to send audio");
          } finally {
            setIsUploading(false);
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
          }
        };
        
        recorder.start();
        setIsRecording(true);
        mediaRecorderRef.current = recorder;
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Microphone access denied or not available");
      }
    }
  };

  return (
    <div className="p-4 md:p-6 border-t border-gray-100 dark:border-[#2E2E2E] bg-[#fdfcfb] dark:bg-[#0d0d0d]">
      <div className="flex items-end gap-2 md:gap-4 bg-white dark:bg-[#1A1A1A] p-2 rounded-[24px] md:rounded-full border border-gray-100 dark:border-[#2E2E2E] shadow-sm">
        {/* Hidden File Inputs */}
        <input type="file" accept="image/*" className="hidden" ref={imageRef} onChange={(e) => handleFileUpload(e, 'image')} />
        <input type="file" accept="video/*" className="hidden" ref={videoRef} onChange={(e) => handleFileUpload(e, 'video')} />
        <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraRef} onChange={(e) => handleFileUpload(e, 'image')} />

        <div className="flex items-center">
          <button 
            onClick={() => setShowActions(!showActions)}
            className="p-2 md:p-3 text-gray-400 hover:text-[#6366F1] transition-colors shrink-0"
          >
            <Plus className={`w-5 h-5 md:w-6 md:h-6 transition-transform ${showActions ? 'rotate-45' : ''}`} />
          </button>

          {showActions && (
            <div className="flex items-center gap-1 md:gap-2 animate-in fade-in zoom-in duration-200">
              <button onClick={() => imageRef.current?.click()} className="p-2 text-gray-400 hover:text-[#6366F1]"><ImageIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
              <button onClick={toggleRecording} className={`p-2 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#6366F1]'}`}><Mic className="w-4 h-4 md:w-5 md:h-5" /></button>
              <button onClick={() => videoRef.current?.click()} className="p-2 text-gray-400 hover:text-[#6366F1]"><Video className="w-4 h-4 md:w-5 md:h-5" /></button>
              <button onClick={() => cameraRef.current?.click()} className="p-2 text-gray-400 hover:text-[#6366F1]"><Camera className="w-4 h-4 md:w-5 md:h-5" /></button>
              <button onClick={handleLocation} className="p-2 text-gray-400 hover:text-[#6366F1]"><MapPin className="w-4 h-4 md:w-5 md:h-5" /></button>
            </div>
          )}
        </div>
        
        <textarea 
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={isUploading || isRecording}
          rows={1}
          className="flex-1 p-2 md:p-3 bg-transparent outline-none text-[#111827] dark:text-[#fdfcfb] placeholder:text-gray-400 resize-none max-h-32 overflow-y-auto"
          placeholder={isRecording ? "Recording audio..." : isUploading ? "Uploading..." : "Type your thoughts..."}
        />
        
        <button 
          onClick={handleSendText} 
          disabled={!text.trim() || isUploading || isRecording}
          className="p-2 md:p-3 bg-[#6366F1] text-white rounded-full hover:bg-[#4f46e5] transition-all disabled:opacity-50 shrink-0"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
