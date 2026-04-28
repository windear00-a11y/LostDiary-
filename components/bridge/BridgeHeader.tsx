'use client';
import { Sparkles, ArrowLeft, Handshake, AlertTriangle, Info, ShieldCheck, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface BridgeHeaderProps {
    bridgeData: any;
    resonanceMsg: string | null;
    checkResonance: () => void;
}

export function BridgeHeader({ bridgeData, resonanceMsg, checkResonance }: BridgeHeaderProps) {
    const router = useRouter();
    const [showPrivacySheet, setShowPrivacySheet] = useState(false);

    const modeInfo = {
        protected: {
            title: "Guardian Protected",
            desc: "The AI Guardian acts as a silent witness, preventing toxic energy or identity leaks while keeping the bridge sacred.",
            icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
        },
        trusted: {
            title: "Soul Trusted",
            desc: "You have verified each other's intent. Monitoring is minimal, but the sanctuary still protects the bridge from extreme disturbances.",
            icon: <Sparkles className="w-5 h-5 text-amber-500" />
        },
        raw: {
            title: "Raw Bridge",
            desc: "Zero monitoring. A pure, direct soul-to-soul connection. Both souls are fully responsible for the light and shadows shared here.",
            icon: <EyeOff className="w-5 h-5 text-rose-500" />
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
                        <h1 className="text-[10px] uppercase tracking-widest text-amber-400 font-bold flex items-center gap-2 mb-1">
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
                    <button onClick={checkResonance} className="p-2 text-amber-400 hover:text-amber-300 transition-colors" title="Check Resonance">
                        <Sparkles className="w-4 h-4" />
                    </button>
                    <div className="relative">
                        {bridgeData.status === 'active' ? (
                            <button 
                                onClick={() => setShowPrivacySheet(true)}
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
                    </div>
                </div>
            </header>

            <BottomSheet
                isOpen={showPrivacySheet}
                onClose={() => setShowPrivacySheet(false)}
                title="Bridge Security & Anonymity"
                subtitle={`Current Mode: ${modeInfo[currentMode].title}`}
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                        <div className="mt-1">{modeInfo[currentMode].icon}</div>
                        <div>
                            <h4 className="text-sm font-bold text-[var(--color-primary-text-dark)] uppercase tracking-wider mb-2">
                                {modeInfo[currentMode].title}
                            </h4>
                            <p className="text-xs text-[var(--color-secondary-text-dark)] font-serif leading-relaxed">
                                {modeInfo[currentMode].desc}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
                            <p className="text-[9px] text-amber-400 uppercase tracking-widest mb-1 font-bold">Privacy Promise</p>
                            <p className="text-[10px] text-slate-500 italic">No logs stored.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
                            <p className="text-[9px] text-amber-500 uppercase tracking-widest mb-1 font-bold">Ephemeral</p>
                            <p className="text-[10px] text-slate-500 italic">Bridge dissolves at dawn.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-500/10 rounded-2xl text-center">
                        <p className="text-xs text-emerald-400 font-serif italic">
                            &quot;Your soul is safe here. WinDear acts as a guardian, not an observer.&quot;
                        </p>
                    </div>
                </div>
            </BottomSheet>

            {resonanceMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} layout className="p-4 mb-8 bg-amber-900/40 border border-amber-500/20 text-amber-100 rounded-2xl text-xs font-serif italic text-center shadow-xl">
                    <Sparkles className="w-3 h-3 inline-block mr-2 text-amber-400" />
                    {resonanceMsg}
                </motion.div>
            )}
        </>
    );
}
