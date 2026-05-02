'use client';

import React from 'react';
import { motion } from 'motion/react';
import { UserProfile, coreService } from '@/lib/services/core-service';
import { SanctuaryMirror } from '@/components/profile/SanctuaryMirror';
import { Fingerprint, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface AboutTheAuthorProps {
  profile: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
}

export const AboutTheAuthor = ({ profile, onUpdate }: AboutTheAuthorProps) => {
  const handleMirrorUpdate = async (intel: any) => {
    try {
      const updated = await coreService.updateProfile(profile.id, { intelligence_profile: intel });
      onUpdate(updated);
    } catch (e: any) {
      toast.error(e.message || "Failed to sync the soul.");
    }
  };

  const handleMirrorSync = async () => {
    try {
      const { profile: updated } = await coreService.syncSanctuaryMirror(profile.id);
      onUpdate(updated);
    } catch (e: any) {
      toast.error(e.message || "Cognitive dissonance detected during sync.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-20 px-6 space-y-24">
      <div className="text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-amber-500/5 rounded-full flex items-center justify-center mx-auto border border-amber-500/10 shadow-[0_0_50px_rgba(245,158,11,0.05)]"
        >
          <Fingerprint className="w-10 h-10 text-amber-500/50" />
        </motion.div>
        
        <div className="space-y-4">
          <h2 className="text-4xl md:text-6xl font-serif text-[var(--color-primary-text-dark)] tracking-tight">
            About the Author
          </h2>
          <div className="w-12 h-px bg-amber-500/30 mx-auto" />
          <p className="text-xl font-serif italic text-white/40 max-w-lg mx-auto">
            {profile.personality_summary || "The echoes of your shared journey are still forming a clear reflection."}
          </p>
        </div>
      </div>

      <div className="pt-10">
        <SanctuaryMirror 
          profile={profile} 
          onUpdate={handleMirrorUpdate}
          onSync={handleMirrorSync}
        />
      </div>

      <div className="pt-32 text-center pb-20 border-t border-white/5">
        <p className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-bold mb-6">End of Reflection</p>
        <div className="flex items-center justify-center gap-4 text-white/10">
           <Sparkles className="w-4 h-4" />
           <div className="w-2 h-2 rounded-full bg-white/20" />
           <Sparkles className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
