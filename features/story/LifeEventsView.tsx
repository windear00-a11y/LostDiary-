'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles, 
  Heart, 
  Star, 
  Flame, 
  Activity, 
  Moon, 
  Sun,
  History,
  CloudRain
} from 'lucide-react';
import { coreService, LifeEvent } from '@/lib/services/core-service';
import { authService } from '@/lib/services/auth-service';
import { format } from 'date-fns';
import { LoadingSpace } from '@/components/ui/LoadingSpace';

const getEmotionIcon = (emotion: string) => {
  const e = emotion.toLowerCase();
  if (e.includes('joy') || e.includes('happy')) return <Sun className="w-5 h-5 text-amber-400" />;
  if (e.includes('sad') || e.includes('sorrow')) return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (e.includes('love') || e.includes('affect')) return <Heart className="w-5 h-5 text-rose-400" />;
  if (e.includes('growth') || e.includes('learn')) return <Sparkles className="w-5 h-5 text-emerald-400" />;
  if (e.includes('anger') || e.includes('frust')) return <Flame className="w-5 h-5 text-orange-500" />;
  if (e.includes('nostal')) return <Moon className="w-5 h-5 text-indigo-400" />;
  return <Star className="w-5 h-5 text-slate-400" />;
};

export function LifeEventsView() {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const user = await authService.getUser();
        if (user) {
          const data = await coreService.fetchLifeEvents(user.id);
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to load life events", error);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  if (loading) return <LoadingSpace message="GATHERING MEMORIES..." />;

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <History className="w-10 h-10 text-white/20" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-serif text-white/50">Your timeline is quiet.</h3>
          <p className="text-xs text-white/20 font-sans uppercase tracking-widest max-w-xs mx-auto italic">
            Keep conversing in the sanctuary to weave your first permanent memories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-32 pb-40 relative">
      <div className="atmosphere pointer-events-none fixed inset-0 z-0 opacity-20" />
      
      {/* Header */}
      <div className="text-center space-y-4 mb-20 relative z-10">
        <h1 className="text-4xl font-serif text-[var(--color-primary-text-dark)]">Memories</h1>
        <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-[var(--color-secondary-text-dark)] italic">
          Sacred shards of your human experience
        </p>
      </div>

      <div className="relative z-10 space-y-1">
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            className="group relative flex gap-6 pb-12"
          >
            {/* Timeline Line */}
            {idx < events.length - 1 && (
              <div className="absolute left-[26px] top-10 bottom-0 w-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent shadow-[0_0_10px_white/5]" />
            )}

            {/* Icon Bubble */}
            <div className="relative z-10 mt-1">
              <div className="w-[52px] h-[52px] rounded-full bg-[#0d0d0d] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                <div className="relative z-10">
                  {getEmotionIcon(event.emotion)}
                </div>
              </div>
              
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-amber-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>

            {/* Content Card */}
            <div className="flex-1 pt-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  {format(new Date(event.created_at), 'MMM dd, yyyy')}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-amber-500/60 italic font-medium">
                  {event.emotion}
                </span>
              </div>

              <div className="space-y-4">
                <blockquote className="text-xl font-serif leading-snug text-white/80 group-hover:text-white transition-colors duration-500">
                  {event.summary}
                </blockquote>
                
                <div className="flex items-center gap-6">
                  {/* Intensity Rank */}
                  <div className="flex gap-1 items-center">
                    <span className="text-[8px] uppercase tracking-widest text-white/20 mr-1">Impact</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1 h-3 rounded-full transition-all duration-700 ${
                          i < event.event_score 
                            ? 'bg-amber-500/50 scale-y-100 shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                            : 'bg-white/5 scale-y-75'
                        }`} 
                      />
                    ))}
                  </div>

                  {/* Chapter Link */}
                  {event.chapter_id && (
                    <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <History className="w-3 h-3 text-amber-400" />
                      <span className="text-[8px] uppercase tracking-widest text-amber-400">Chapters Linked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
