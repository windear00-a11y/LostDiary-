'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export default function ChatInterface({ bridgeId }: { bridgeId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch(`/api/bridge/${bridgeId}/messages`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    };
    fetchMessages();
  }, [bridgeId]);

  const sendMessage = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await fetch('/api/bridge/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridgeId, content })
      });
      setContent('');
      // In prod, use real-time subscription
      window.location.reload(); 
    } catch (e) {
      alert("Failed to send: Message might be unsafe.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-gray-200 dark:border-white/5 rounded-[32px] overflow-hidden bg-white dark:bg-[#111]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[80%] font-serif text-sm ${m.sender_id === user?.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-gray-100'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-white/5 flex gap-2">
        <input 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Whisper something..."
          className="flex-1 bg-transparent outline-none font-serif text-sm px-2"
        />
        <button onClick={sendMessage} disabled={sending} className="p-3 bg-indigo-500 text-white rounded-full">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
