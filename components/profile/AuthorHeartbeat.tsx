'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Leaf, Droplets, Handshake, Send, BookOpen, Eye, RefreshCcw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const AuthorHeartbeat = () => {
    const [stats, setStats] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

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

    return (
        <div className="space-y-10">
            <div className="flex flex-col items-center text-center px-4">
                <div className="relative mb-6">
                    <motion.div 
                        animate={isSyncing ? { rotate: 360 } : {}}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center shadow-2xl shadow-amber-500/10"
                    >
                        <Sparkles className="w-10 h-10 text-amber-500" />
                    </motion.div>
                    
                    <button 
                        onClick={fetchHeartbeat}
                        disabled={isSyncing}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                        title="Sync Energy Jar"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-3 italic">
                    The Energy Jar
                </h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 italic font-serif leading-relaxed max-w-sm">
                    A collection of resonance gathered from souls who breathed your words in the library.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
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
                                className="group bg-white dark:bg-[#111] rounded-[36px] p-8 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
                            >
                                {/* The Jar Filling Animation Background */}
                                <motion.div 
                                    className="absolute bottom-0 left-0 right-0 bg-indigo-500/5 dark:bg-indigo-500/10"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${resonancePercent}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="max-w-[70%]">
                                            <h3 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-2 leading-tight">
                                                {story.title}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Legacy Thread</span>
                                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="text-[10px] text-indigo-500 font-bold uppercase">Resonating</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-4xl font-serif font-bold text-indigo-600 dark:text-indigo-400">
                                               {resonancePercent}%
                                            </div>
                                            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Resonance</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-slate-50 dark:bg-black/40 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                                            <Eye className="w-6 h-6 text-slate-400 mb-3" />
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{story.views_count}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Breathed by</div>
                                        </div>
                                        <div className="p-6 bg-amber-500/5 dark:bg-amber-500/10 rounded-3xl border border-amber-500/10 flex flex-col items-center justify-center text-center">
                                            <Sparkles className="w-6 h-6 text-amber-500 mb-3" />
                                            <div className="text-2xl font-bold text-amber-500">{totalReactions}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-amber-500 mt-1">Energy Points</div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                       <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                                          <Info className="w-3 h-3" />
                                          Higher resonance builds stronger bridges.
                                       </div>
                                       <motion.div 
                                          animate={{ scale: [1, 1.1, 1] }} 
                                          transition={{ repeat: Infinity, duration: 3 }}
                                          className="w-2 h-2 rounded-full bg-indigo-500" 
                                       />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {stats.length === 0 && !isSyncing && (
                    <div className="p-20 text-center bg-slate-50 dark:bg-white/[0.02] rounded-[48px] border border-dashed border-slate-200 dark:border-white/5">
                        <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-serif italic italic">Publish your first legacy to start gathering resonance energy.</p>
                    </div>
                )}
            </div>
            
            <p className="text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium pt-8">
               Your energy is infinite, your words are eternal.
            </p>
        </div>
    );
};
