'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { coreService, UserProfile, IntelligenceProfile } from '@/lib/services/core-service';
import { getGenAI } from '@/lib/genai';
import { generateContentWithFallback } from '@/lib/genai-utils';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { motion, AnimatePresence } from 'motion/react';
import { User, Camera, Sparkles, LogOut, Save, Edit2, Shield, Send, Book, Handshake, ChevronRight, MessageSquare, Heart, ChevronDown, ChevronUp, MoreVertical, Trash2, ExternalLink, BookOpen } from 'lucide-react';
import { DeleteAccountModal } from '@/components/profile/DeleteAccountModal';
import { FeedbackDrawer } from '@/components/ui/FeedbackDrawer';
import { SanctuaryMirror } from '@/components/profile/SanctuaryMirror';
import { PrivacyTrustCenter } from '@/components/profile/PrivacyTrustCenter';
import { SuccessMoment } from '@/components/ui/SuccessMoment';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';
import Image from 'next/image';

export default function ProfilePage() {
  const ai = getGenAI();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { setActiveView, activeProfileTab, setActiveProfileTab } = useUIStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessMoment, setShowSuccessMoment] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [penName, setPenName] = useState('');
  const [bio, setBio] = useState('');

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await coreService.requestAccountDeletion(user.id);
      setShowDeleteModal(false);
      await signOut();
      router.push('/');
    } catch (e) {
      console.error(e);
      setError("Failed to schedule deletion.");
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadProfile = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await coreService.getProfile(user.id);
      setProfile(data);
      setDisplayName(data.display_name || '');
      setPenName(data.pen_name || '');
      setBio(data.bio || '');
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const updated = await coreService.updateProfile(user.id, {
        display_name: displayName,
        pen_name: penName,
        bio: bio
      });
      setProfile(updated);
      setIsEditing(false);
      setShowSuccessMoment(true);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setError(error.message || "Failed to save changes. Pen Name might heavily conflict, try another.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIntelligence = async (updatedIntel: IntelligenceProfile) => {
    if (!user || !profile) return;
    try {
      const updated = await coreService.updateProfile(user.id, {
        intelligence_profile: updatedIntel
      });
      setProfile(updated);
      toast.info("Mirror reflection refined.");
    } catch (error) {
      console.error("Error updating intelligence:", error);
      throw error;
    }
  };
  
  const handleSyncMirror = async () => {
    if (!user) return;
    try {
      const { profile: updated } = await coreService.syncSanctuaryMirror(user.id);
      setProfile(updated);
    } catch (error) {
      console.error("Error syncing mirror:", error);
      throw error;
    }
  };

  const generateAIAvatar = async () => {
    if (!user) return;
    try {
      setIsGenerating(true);
      setError(null);
      
      const messages = await coreService.fetchMessages(user.id);
      const intel = profile?.intelligence_profile;
      const personalitySummary = profile?.personality_summary;

      const hasMirrorData = intel && Object.keys(intel).some(k => Object.keys((intel as any)[k] || {}).length > 0);
      
      // If no mirror data, need at least some messages
      if (!personalitySummary && !hasMirrorData && messages.length < 3) {
        setError("WinDear needs more reflection data. Try writing 3+ entries or syncing your Sanctuary Mirror first.");
        return;
      }

      const mirrorInsights = intel ? `
- Thinking Style: ${JSON.stringify(intel.thinking_style || {})}
- Soul Mood: ${JSON.stringify(intel.emotional_state || {})}
- Echo Patterns: ${JSON.stringify(intel.communication_style || {})}
- Deep Orbits: ${JSON.stringify(intel.interests_goals || {})}
` : "";

      const recentContext = messages
        .filter(m => m.role === 'user' && m.content)
        .slice(-15)
        .map(m => m.content)
        .join('\n');

      const promptResponse = await generateContentWithFallback({
        model: "gemini-1.5-pro",
        contents: `Generate a visual prompt for a professional, abstract profile avatar. 
Use the Soul Signature and Mirror Intelligence as the primary source of truth for the persona's essence.

PRIMARY SOURCE - Soul Signature:
${personalitySummary || "A deep, unfolding mystery."}

SECONDARY SOURCE - Mirror Intelligence:
${mirrorInsights || "Patterns still forming."}

SUPPORTING CONTEXT - Recent Thoughts:
${recentContext}

The avatar must be highly SYMBOLIC and ABSTRACT. It should represent their unique spiritual or psychological signature using geometric patterns, ethereal structures, cosmic phenomena, or organic textures. 
IMPORTANT: DO NOT describe a literal portrait of a person.

Output ONLY the visual description for an image generation tool.`,
      });

      const visualPrompt = promptResponse.text || "A serene and abstract representation of a thoughtful soul, soft colors, ethereal light.";

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Artistic minimalist avatar: ${visualPrompt}. High precision, ethereal glow, dark sophisticated background, masterpiece quality, clean lines.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      if (!imageResponse.candidates?.[0]?.content?.parts) {
        throw new Error("EMPTY_IMAGE_RESPONSE");
      }

      let base64Image = '';
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          // Prepend data prefix so core-service fetch works correctly
          base64Image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!base64Image) throw new Error("NO_IMAGE_DATA_EXTRACTED");

      const publicUrl = await coreService.uploadAvatar(user.id, base64Image);
      const updated = await coreService.updateProfile(user.id, {
        avatar_url: publicUrl
      });
      setProfile(updated);
      toast.success("Identity visual manifested from your Sanctuary Mirror.");
      
    } catch (err: any) {
      console.error("Avatar Gen Failure:", err);
      
      let message = "WinDear encountered an interference in the visualization.";
      
      if (err.message?.includes("SAFETY")) {
        message = "Visualization dimmed by safety resonance. Try a different mood.";
      } else if (err.message?.includes("quota") || err.message?.includes("429")) {
        message = "The Archive's creative energy is depleted for now. Try again later.";
      } else if (err.message === "EMPTY_IMAGE_RESPONSE") {
        message = "The visual stream was empty. Retrying might clear the haze.";
      } else if (err.message) {
        message = `Resonance Error: ${err.message}`;
      }

      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpace />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-32">
      <SuccessMoment 
        isOpen={showSuccessMoment} 
        onClose={() => setShowSuccessMoment(false)}
        title="Identity Refined"
        subtitle="Your presence in the sanctuary has been updated."
        type="save"
      />

      <main className="max-w-2xl mx-auto px-6 pt-24 font-sans">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-[13px] text-rose-400 text-center uppercase tracking-widest font-bold"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeProfileTab === 'identity' ? (
            <motion.div 
              key="identity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-[#111] rounded-[32px] p-8 shadow-sm border border-white/10"
            >
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-10">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[32px] overflow-hidden bg-white/5 border border-white/10 shadow-xl relative">
                    {profile?.avatar_url ? (
                      <Image 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        fill 
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        <User className="w-12 h-12" />
                      </div>
                    )}
                    
                    <AnimatePresence>
                      {isGenerating && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                        >
                          <div className="flex gap-1.5 px-3">
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-white rounded-full" />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-white rounded-full" />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <button 
                    onClick={generateAIAvatar}
                    disabled={isGenerating}
                    className="absolute -bottom-3 -right-3 p-3 bg-white text-black hover:bg-neutral-200 rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                    title="Generate AI Avatar"
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Anonymous Avatar
                </p>
              </div>

              {/* Info Section */}
              <div className="space-y-8">
                <div className="group">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Personal Display Name</label>
                    <button 
                      onClick={() => { if(isEditing) handleSaveProfile(); setIsEditing(!isEditing); }}
                      className="text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors"
                    >
                      {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>
                  </div>
                  {isEditing ? (
                    <input 
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-white/30 transition-colors text-white text-lg placeholder:text-white/20"
                      placeholder="Your private name..."
                    />
                  ) : (
                    <h2 className="text-2xl font-serif text-white/90">
                      {profile?.display_name || user?.email?.split('@')[0] || 'Unknown'}
                    </h2>
                  )}
                  <p className="text-[11px] text-emerald-400/60 mt-2 tracking-wide">Visible only to you and WinDear.</p>
                </div>

                <div className="group">
                  <div className="flex items-center justify-between mb-3">
                     <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/60">Pen Name (For Library)</label>
                  </div>
                  
                  {isEditing ? (
                    <input 
                      type="text"
                      value={penName}
                      onChange={(e) => setPenName(e.target.value)}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-white/30 transition-colors text-white text-lg placeholder:text-white/20"
                      placeholder="E.g., The Midnight Thinker"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-serif italic text-white/90">
                        {profile?.pen_name || 'Anonymous Author'}
                      </h2>
                      {profile?.pen_name_tag && (
                        <span className="bg-white/5 border border-white/10 text-white/60 font-mono text-xs px-2 py-1 rounded-lg">
                          #{profile.pen_name_tag}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-white/30 mt-2 tracking-wide">This is how you will uniquely be known.</p>
                </div>

                <div className="group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 block mb-3">Author&apos;s Bio</label>
                  {isEditing ? (
                    <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-white/30 transition-colors text-white text-[15px] placeholder:text-white/20 resize-none h-28 leading-relaxed"
                      placeholder="Write a little about the mind behind the stories..."
                    />
                  ) : (
                    <p className="text-white/60 leading-relaxed font-serif text-[15px]">
                      {profile?.bio || "A silent observer writing their way through life."}
                    </p>
                  )}
                </div>

                {profile?.personality_summary && (
                  <div className="pt-6 mt-6 border-t border-white/5">
                    <div className="flex items-center justify-between group/sig cursor-pointer" onClick={() => setActiveProfileTab('mirror')}>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400/60 block">Soul Signature</label>
                        <p className="text-sm font-serif italic text-white/80 line-clamp-2 leading-relaxed pr-4">
                          &ldquo;{profile.personality_summary}&rdquo;
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover/sig:text-white group-hover/sig:translate-x-1 transition-all" />
                    </div>
                  </div>
                )}
              </div>

              {/* Portal Button */}
              <div className="mt-10">
                <button
                  onClick={() => setActiveProfileTab('mirror')}
                  className="w-full group rounded-2xl py-4 px-6 bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-200/70 group-hover:text-indigo-200">Reflect on Patterns</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              {/* Actions */}
              <div className="mt-10 pt-6 border-t border-white/5">
                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center gap-3 p-4 text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-colors font-bold uppercase tracking-widest text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  Drop Connection
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-[#111] rounded-[32px] p-8 shadow-sm border border-white/10"
            >
              {activeProfileTab === 'mirror' ? (
                <>
                  {profile && <SanctuaryMirror profile={profile} onUpdate={handleUpdateIntelligence} onSync={handleSyncMirror} />}
                </>
              ) : activeProfileTab === 'vault' ? (
                <div className="space-y-10">
                   <PrivacyTrustCenter />
                   
                   <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 px-2">Account Management</h4>
                      <button 
                        onClick={() => window.open('/api/profile/export', '_blank')}
                        className="w-full text-[13px] text-white/80 hover:text-white font-bold uppercase tracking-widest transition-all px-6 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-left"
                      >
                        Export Data
                      </button>
                      <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full text-[13px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-widest transition-all px-6 py-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl hover:bg-rose-500/10 text-left"
                      >
                        Permadelete
                      </button>
                   </div>
                </div>
              ) : (
                <div className="text-center p-8 text-white/30">Resonance lost. Try selecting a tab above.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-white/5 text-center flex flex-col items-center gap-6">
        </div>

        <DeleteAccountModal 
          isOpen={showDeleteModal} 
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDeleteAccount}
        />
        
        <FeedbackDrawer />

        <p className="text-center mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
          Your deep data never leaves the Mirror.
        </p>
      </main>
    </div>
  );
}
