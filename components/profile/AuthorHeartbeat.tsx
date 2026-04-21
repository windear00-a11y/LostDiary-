'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Leaf, Droplets, Handshake, Send, BookOpen, Eye } from 'lucide-react';
import { motion } from 'motion/react';

export const AuthorHeartbeat = () => {
    const [stats, setStats] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/profile/heartbeat').then(r => r.json()).then(d => setStats(d.heartbeat || []));
    }, []);

    return (
        <div className="space-y-8 p-6 bg-white dark:bg-[#111] rounded-3xl border border-slate-100 dark:border-white/5">
            <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Your Emotional Heartbeat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.map(story => {
                    const totalReactions = story.library_reactions?.length || 0;
                    const resonanceIndex = story.views_count > 0 ? ((totalReactions / story.views_count) * 100).toFixed(0) : 0;
                    return (
                        <div key={story.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                            <h3 className="font-serif font-bold text-slate-800 dark:text-slate-100 mb-4">{story.title}</h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 bg-white dark:bg-black rounded-lg">
                                    <Eye className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                                    <div className="text-sm font-bold">{story.views_count}</div>
                                    <div className="text-[9px] uppercase text-slate-400">Breathed by</div>
                                </div>
                                <div className="p-2 bg-white dark:bg-black rounded-lg">
                                    <Sparkles className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                                    <div className="text-sm font-bold">{totalReactions}</div>
                                    <div className="text-[9px] uppercase text-slate-400">Energy</div>
                                </div>
                                <div className="p-2 bg-white dark:bg-black rounded-lg">
                                    <div className="text-sm font-bold text-indigo-500">{resonanceIndex}%</div>
                                    <div className="text-[9px] uppercase text-slate-400">Resonance</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
