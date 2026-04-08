'use client';

import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Mic, Video, Camera, MapPin, Loader2, Square } from 'lucide-react';
import { chatService } from '@/lib/services/chat-service';
import { authService } from '@/lib/services/auth-service';

export const ChatInput = ({ onSendMessage }: { onSendMessage: (msg: any) => Promise<void> }) => {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSendText = async () => {
    if (!text.trim() || isUploading) return;
    await onSendMessage({ role: 'user', type: 'text', content: text, media_url: null });
    setText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const user = await authService.getUser();
      if (!user) throw new Error("User not found");

      const url = await chatService.uploadMedia(file, user.id);
      await onSendMessage({ role: 'user', type, content: null, media_url: url });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      alert(`Failed to upload ${type}`);
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

    try {
      setIsUploading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          await onSendMessage({ 
            role: 'user', 
            type: 'location', 
            content: `📍 Shared location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 
            media_url: mapUrl 
          });
          setIsUploading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Failed to get location");
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error("Location error:", error);
      setIsUploading(false);
    }
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
            const user = await authService.getUser();
            if (user) {
              const url = await chatService.uploadMedia(file, user.id);
              await onSendMessage({ role: 'user', type: 'audio', content: null, media_url: url });
            }
          } catch (error) {
            console.error("Error uploading audio:", error);
            alert("Failed to upload audio");
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
    <div className="p-4 border-t border-gray-100 dark:border-[#2E2E2E] bg-white dark:bg-[#0A0A0A]">
      <div className="flex items-center gap-2">
        {/* Hidden File Inputs */}
        <input type="file" accept="image/*" className="hidden" ref={imageRef} onChange={(e) => handleFileUpload(e, 'image')} />
        <input type="file" accept="video/*" className="hidden" ref={videoRef} onChange={(e) => handleFileUpload(e, 'video')} />
        <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraRef} onChange={(e) => handleFileUpload(e, 'image')} />

        <button 
          onClick={() => imageRef.current?.click()} 
          disabled={isUploading || isRecording}
          className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        
        <button 
          onClick={toggleRecording} 
          disabled={isUploading}
          className={`p-2 transition-colors disabled:opacity-50 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-indigo-600'}`}
        >
          {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
        </button>
        
        <button 
          onClick={() => videoRef.current?.click()} 
          disabled={isUploading || isRecording}
          className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50"
        >
          <Video className="w-5 h-5" />
        </button>
        
        <button 
          onClick={() => cameraRef.current?.click()} 
          disabled={isUploading || isRecording}
          className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
        </button>
        
        <button 
          onClick={handleLocation} 
          disabled={isUploading || isRecording}
          className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50"
        >
          <MapPin className="w-5 h-5" />
        </button>
        
        <input 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
          disabled={isUploading || isRecording}
          className="flex-1 p-2 rounded-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] disabled:opacity-50"
          placeholder={isRecording ? "Recording audio..." : isUploading ? "Uploading..." : "Type a message..."}
        />
        
        <button 
          onClick={handleSendText} 
          disabled={!text.trim() || isUploading || isRecording}
          className="p-2 text-indigo-600 disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
