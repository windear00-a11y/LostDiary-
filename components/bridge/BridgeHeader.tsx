'use client';
import { Sparkles, ArrowLeft, Handshake, AlertTriangle, Info, ShieldCheck, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

interface BridgeHeaderProps {
    bridgeData: any;
    resonanceMsg: string | null;
    checkResonance: () => void;
}

export function BridgeHeader({ bridgeData, resonanceMsg, checkResonance }: BridgeHeaderProps) {
    const router = useRouter();
    const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

    const modeInfo = {
        protected: {
            title: "Guardian Protected",
            desc: "AI Guardian prevents toxicity & identity reveal. Private & secure.",
            icon: <ShieldCheck className="w-3 h-3" />
        },
        trusted: {
            title: "Soul Trusted",
            desc: "Identity filters lifted. AI only blocks extreme toxicity. Total trust.",
            icon: <Sparkles className="w-3 h-3 text-amber-500" />
        },
        raw: {
            title: "Raw Bridge",
            desc: "Zero AI monitoring. End-to-end soul connection. You are responsible.",
            icon: <EyeOff className="w-3 h-3 text-rose-500" />
        }
    };

    const currentMode = (bridgeData.mode as keyof typeof modeInfo) || 'protected';

    return (
        <>
            <header className="flex-shrink-0 flex items-center justify-between mb-8 pb-4 border-b border-white/5 relative">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors">
                        <ArrowLeft className="w-4 h-4 text-white/50" />
                    </button>
                    <div>
                        <h1 className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold flex items-center gap-2 mb-1">
                            <Handshake className="w-3 h-3" />
                            The Midnight Bridge
                        </h1>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-xl font-serif">{bridgeData.other.pen_name}</h2>
                            <span className="text-xs font-mono text-white/30">#{bridgeData.other.pen_name_tag}</span>
                        </div>
                    </div>
                </div>
                
                <div className="text-right flex items-center gap-3">
                    <button onClick={checkResonance} className="p-2 text-indigo-400 hover:text-indigo-300 transition-colors" title="Check Resonance">
                        <Sparkles className="w-4 h-4" />
                    </button>
                    <div className="relative">
                        {bridgeData.status === 'active' ? (
                            <button 
                                onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
                                className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-emerald-500/80 hover:bg-emerald-500/10 px-2 py-1 rounded-full transition-colors"
                            >
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                {modeInfo[currentMode].title}
                                <Info className="w-2.5 h-2.5 opacity-50" />
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-rose-500">
                                <AlertTriangle className="w-3 h-3" />
                                Bridge Broken
                            </div>
                        )}

                        <AnimatePresence>
                            {showPrivacyInfo && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-64 p-4 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-50 text-left"
                                >
                                    <div className="flex items-center gap-2 mb-2 text-indigo-400 uppercase tracking-tighter text-[10px] font-bold">
                                        {modeInfo[currentMode].icon}
                                        {modeInfo[currentMode].title}
                                    </div>
                                    <p className="text-xs text-white/60 font-serif leading-relaxed mb-3">
                                        {modeInfo[currentMode].desc}
                                    </p>
                                    <div className="pt-3 border-t border-white/5">
                                        <p className="text-[9px] text-white/30 uppercase tracking-widest">Privacy Promise</p>
                                        <p className="text-[10px] text-white/40 italic">No logs stored. AI Guardian forgets everything once the bridge closes.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {resonanceMsg && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="p-4 mb-4 bg-indigo-900/20 border border-indigo-500/20 text-indigo-200 rounded-2xl text-xs font-serif italic text-center">
                    {resonanceMsg}
                </motion.div>
            )}
        </>
    );
}
