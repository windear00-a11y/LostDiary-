'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '@/components/ui/Header';
import { BridgeHeader } from '@/components/bridge/BridgeHeader';
import { Send, Handshake, AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BridgePage({ params }: { params: { id: string } }) {
  const bridgeId = params.id;
  const router = useRouter();
  const [bridgeData, setBridgeData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [resonanceMsg, setResonanceMsg] = useState<string|null>(null);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const fetchBridge = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/bridge/${bridgeId}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setBridgeData(data.bridge);
        setMessages(data.messages);
      }
    } catch (e) {
      setError("Failed to connect to the bridge.");
    } finally {
      setLoading(false);
    }
  }, [bridgeId]);

  useEffect(() => {
    fetchBridge();
    // Simple polling every 5 seconds for simulation (realtime would be better for prod)
    const interval = setInterval(fetchBridge, 5000);
    return () => clearInterval(interval);
  }, [fetchBridge]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkResonance = async () => {
    try {
        const res = await fetch('/api/bridge/check-resonance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bridgeId })
        });
        const data = await res.json();
        setResonanceMsg(data.message);
        setTimeout(() => setResonanceMsg(null), 10000);
    } catch (e) {
        alert("Couldn't feel the resonance.");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending || bridgeData?.status === 'broken') return;
    
    setSending(true);
    try {
      const res = await fetch(`/api/bridge/${bridgeId}/send`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message: inputMessage })
      });
      const data = await res.json();
      if (!res.ok) {
         if (data.status === 'broken') {
             setBridgeData(prev => ({...prev, status: 'broken'}));
             setError(data.message);
         } else {
             alert(data.error || 'Failed to send message');
         }
      } else {
         setInputMessage('');
         fetchBridge();
      }
    } catch (e) {
       alert("Network Error");
    } finally {
       setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Connecting to the bridge...</div>;
  if (!bridgeData && error) return <div className="min-h-screen bg-black flex items-center justify-center text-rose-500">{error}</div>;

  return (
    <div className="h-[100dvh] bg-[#0A0A0B] flex flex-col relative overflow-hidden text-slate-200">
      <Header />
      
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
      
      <main className="flex-1 max-w-3xl w-full mx-auto flex flex-col pt-24 px-4 h-full relative z-10">
        {/* Header Section */}
        <BridgeHeader bridgeData={bridgeData} resonanceMsg={resonanceMsg} checkResonance={checkResonance} />

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-6 scrollbar-whatsapp pr-2">
           <div className="p-6 border border-white/5 rounded-3xl bg-white/[0.01] text-center mb-8">
              <p className="font-serif italic text-white/40 text-sm leading-relaxed max-w-lg mx-auto">
                 &quot;You are standing on a bridge built from silent resonance. Your soul is private, but your safety is our priority. No logs are kept—this bridge dissolves with the dawn.&quot;
              </p>
           </div>

           {messages.map((msg, i) => {
              const isMine = msg.isMine;
              return (
                 <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] md:max-w-[60%] p-5 rounded-3xl ${isMine ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/10 rounded-br-sm' : 'bg-white/5 text-white/90 border border-white/5 rounded-bl-sm'}`}>
                       <p className="font-serif text-sm md:text-base leading-relaxed">{msg.content}</p>
                       <div className={`text-[9px] mt-3 opacity-30 ${isMine ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                    </div>
                 </div>
              );
           })}
           <div ref={endOfMessagesRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 pt-4 pb-6 mt-4">
           {error && bridgeData.status === 'broken' && (
              <div className="p-4 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs flex items-start gap-2">
                 <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                 <p className="leading-relaxed">{error}</p>
              </div>
           )}
           <form onSubmit={handleSend} className="relative">
              <input
                 type="text"
                 value={inputMessage}
                 onChange={(e) => setInputMessage(e.target.value)}
                 disabled={sending || bridgeData.status === 'broken'}
                 placeholder={bridgeData.status === 'active' ? "Write your message..." : "The bridge has fallen."}
                 className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 pr-16 outline-none focus:border-indigo-500/50 transition-colors text-sm font-serif disabled:opacity-50"
              />
              <button 
                 type="submit"
                 disabled={sending || !inputMessage.trim() || bridgeData.status === 'broken'}
                 className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                 {sending ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send className="w-4 h-4" />}
              </button>
           </form>
        </div>
      </main>
    </div>
  );
}
