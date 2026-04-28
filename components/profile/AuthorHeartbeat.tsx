'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Leaf, Droplets, Handshake, Send, BookOpen, Eye, RefreshCcw, Info, Activity, Wind, Waves, Heart, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const AuthorHeartbeat = () => {
    const [stats, setStats] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeLayer, setActiveLayer] = useState<'wave' | 'radar'>('wave');

    const fetchHeartbeat = useCallback(async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/profile/heartbeat');
            const data = await res.json();
            setStats(data.heartbeat || []);
            // Simulate deep sync time
            await new Promise(r => setTimeout(r, 800));
        } catch (e) {
            toast.error("Shadows interfered with the sync.");
        } finally {
            setIsSyncing(false);
        }
    }, []);

    useEffect(() => {
        fetchHeartbeat();
    }, [fetchHeartbeat]);

    const globalViews = stats.reduce((acc, curr) => acc + curr.views_count, 0);
    const globalReactions = stats.reduce((acc, curr) => acc + (curr.library_reactions?.length || 0), 0);
    const overallResonance = globalViews > 0 ? ((globalReactions / globalViews) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-16 py-12">
            <div className="flex flex-col items-center text-center px-4">
                <div className="relative mb-6">
                    <motion.div 
                        animate={isSyncing ? { rotate: 360 } : {}}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.2)] backdrop-blur-md"
                    >
                        <Activity className="w-10 h-10 text-amber-400" />
                    </motion.div>
                    
                    <button 
                        onClick={fetchHeartbeat}
                        disabled={isSyncing}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                        title="Sync Sanctum"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--color-primary-text-dark)] mb-4 italic tracking-tight">
                    Sanctum
                </h2>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                    <div className="w-8 h-px bg-slate-300 dark:bg-white/10" />
                    The Author&apos;s Soul Chart
                    <div className="w-8 h-px bg-slate-300 dark:bg-white/10" />
                </div>
            </div>

            {/* Global Metrics Dashboard */}
            {stats.length > 0 && (
                <div className="grid grid-cols-3 gap-4 md:gap-8">
                    <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Eye className="w-5 h-5 text-amber-400 mb-4" />
                        <span className="text-4xl font-serif text-[var(--color-primary-text-dark)]">{globalViews}</span>
                        <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-2 font-bold">Total Glances</span>
                    </div>
                    
                    <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Heart className="w-5 h-5 text-rose-400 mb-4" />
                        <span className="text-4xl font-serif text-[var(--color-primary-text-dark)]">{globalReactions}</span>
                        <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-2 font-bold">Soul Echoes</span>
                    </div>

                    <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <TrendingUp className="w-5 h-5 text-emerald-400 mb-4" />
                        <span className="text-4xl font-serif text-emerald-500">{overallResonance}%</span>
                        <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-2 font-bold">Avg Resonance</span>
                    </div>
                </div>
            )}

            {/* Individual Volume Data */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Pulse Signatures</h3>
                    <div className="flex bg-slate-100 dark:bg-white/5 rounded-full p-1 border border-slate-200 dark:border-white/10">
                        <button 
                            onClick={() => setActiveLayer('wave')} 
                            className={`p-2 rounded-full transition-colors ${activeLayer === 'wave' ? 'bg-white dark:bg-white/5 text-amber-500 shadow-sm' : 'text-slate-400'}`}
                        >
                            <Waves className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setActiveLayer('radar')} 
                            className={`p-2 rounded-full transition-colors ${activeLayer === 'radar' ? 'bg-white dark:bg-white/5 text-amber-500 shadow-sm' : 'text-slate-400'}`}
                        >
                            <Wind className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="popLayout">
                    {stats.map((story, idx) => {
                        const totalReactions = story.library_reactions?.length || 0;
                        const resonanceScore = story.views_count > 0 ? (totalReactions / story.views_count) : 0;
                        const resonancePercent = (resonanceScore * 100).toFixed(0);
                        
                        return (
                            <motion.div 
                                key={story.id} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group bg-white dark:bg-[#0A0A0A] rounded-[36px] p-8 md:p-12 border border-slate-100 dark:border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all relative overflow-hidden"
                            >
                                {/* Abstract Data Vis Layer */}
                                {activeLayer === 'wave' && (
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.1] overflow-hidden flex items-end">
                                        <motion.div 
                                            initial={{ y: "100%" }}
                                            animate={{ y: `${100 - Number(resonancePercent)}%` }}
                                            transition={{ duration: 2, ease: "easeOut" }}
                                            className="w-full h-[200%] bg-amber-500 rounded-t-[100%] scale-150 transform translate-y-1/2" 
                                        />
                                    </div>
                                )}
                                
                                {activeLayer === 'radar' && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none opacity-[0.03] dark:opacity-[0.1] mix-blend-screen">
                                         <motion.div 
                                            animate={{ rotate: 360 }} 
                                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0"
                                            style={{
                                                background: `conic-gradient(from 0deg, transparent 0deg, transparent 180deg, #6366F1 360deg)`
                                            }}
                                         />
                                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border-4 border-dashed border-[#6366F1] rounded-full" />
                                    </div>
                                )}

                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex-1 max-w-xl">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                                                <BookOpen className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Volume {idx + 1}</span>
                                        </div>
                                        <h3 className="text-3xl font-serif font-bold text-slate-800 dark:text-white mb-4 leading-tight tracking-tight">
                                            {story.title}
                                        </h3>
                                        <p className="text-sm text-[var(--color-secondary-text-dark)] font-serif italic line-clamp-2">
                                            &quot;A deeply personal reflection mapping the architecture of your experiences.&quot;
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-row md:flex-col gap-6 md:gap-4 shrink-0">
                                        <div className="text-left md:text-right">
                                            <div className="flex items-end md:justify-end gap-2 mb-1">
                                                <span className="text-4xl font-serif font-bold text-amber-600 dark:text-amber-400">{resonancePercent}%</span>
                                                <Sparkles className="w-5 h-5 text-amber-400 pb-1" />
                                            </div>
                                            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Aura Resonance</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {stats.length === 0 && !isSyncing && (
                    <div className="p-20 text-center bg-[#050505] rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent pointer-events-none" />
                        <Droplets className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-6 opacity-30" />
                        <h4 className="text-xl font-serif text-white mb-2 italic">The canvas is blank</h4>
                        <p className="text-slate-500 text-sm font-serif italic">Publish your first legacy to start mapping your author&apos;s soul.</p>
                    </div>
                )}
            </div>
            
            <p className="text-center text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold pt-16 opacity-50">
               {`// Tracking Emotional Footprints`}
            </p>
        </div>
    );
};
