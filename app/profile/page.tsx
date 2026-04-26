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
import { Header } from '@/components/ui/Header';
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
  const { setActiveView } = useUIStore();
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
  const [activeTab, setActiveTab] = useState<'general' | 'mirror' | 'sanctum' | 'privacy' | 'account'>('general');

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

  const generateAIAvatar = async () => {
    if (!user) return;
    try {
      setIsGenerating(true);
      setError(null);
      
      const messages = await coreService.fetchMessages(user.id);
      if (messages.length < 3) {
        setError("WinDear needs at least 3 entries to understand your persona.");
        return;
      }

      const recentContext = messages
        .filter(m => m.role === 'user')
        .slice(-10)
        .map(m => m.content)
        .join('\n');

      // Incorporate Sanctuary Mirror intelligence for deeper alignment
      const intel = profile?.intelligence_profile;
      const mirrorInsights = intel ? `
- Core Thinking: ${JSON.stringify(intel.thinking_style)}
- Emotional Baseline: ${JSON.stringify(intel.emotional_state)}
- Interests & Subconscious Goals: ${JSON.stringify(intel.interests_goals)}
` : "";

      const promptResponse = await generateContentWithFallback({
        model: "gemini-3.1-pro-preview",
        contents: `Based on these diary entries and deeper psychological intelligence from their "Sanctuary Mirror", describe a symbolic, artistic, and abstract avatar that represents this person's unique soul and personality.

Mirror Intelligence:
${profile?.personality_summary || "Unknown"}
${mirrorInsights}

Recent Entries:
${recentContext}

The avatar should not be a direct portrait of a person, but an abstract representation of their inner world. Keep the description concise, evocative, and visual.

Output only the visual description for an image generation tool.`,
      });

      const visualPrompt = promptResponse.text || "A serene and abstract representation of a thoughtful soul, soft colors, ethereal light.";

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A professional, artistic profile avatar: ${visualPrompt}. Minimalist, elegant, high quality, soft lighting, artistic style.`,
            },
          ],
        },
      });

      let base64Image = '';
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (base64Image) {
        const publicUrl = await coreService.uploadAvatar(user.id, base64Image);
        const updated = await coreService.updateProfile(user.id, {
          avatar_url: publicUrl
        });
        setProfile(updated);
        toast.success("Avatar manifested from your Sanctuary Mirror.");
      }
    } catch (error) {
      console.error("Error generating avatar:", error);
      setError("AI generation failed. Please try again in a moment.");
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
          {activeTab === 'general' ? (
            <motion.div 
              key="front"
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
                  <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">AI Insight</span>
                    </div>
                    <p className="text-sm text-indigo-200/80 leading-relaxed">
                      {profile.personality_summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Portal Button */}
              <div className="mt-12">
                <button
                  onClick={() => setActiveTab('mirror')}
                  className="w-full relative overflow-hidden group rounded-2xl p-6 bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Shield className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                    <span className="text-white/70 font-sans tracking-wide text-lg group-hover:text-white transition-colors">Step into The Mirror</span>
                  </div>
                  <p className="text-[11px] uppercase tracking-widest text-white/30 mt-3 font-bold">Deep intelligence gathered about your subconscious</p>
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
              key="back"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-[#111] rounded-[32px] p-8 shadow-sm border border-white/10"
            >
              <button 
                onClick={() => setActiveTab('general')}
                className="mb-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white flex items-center gap-2 transition-colors"
              >
                ← Return
              </button>
                            {/* Sub-Switcher */}
              <div className="flex gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar border-b border-white/5">
                 <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${activeTab === 'general' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                    <User className="w-3 h-3" /> Identity
                 </button>
                 <button onClick={() => setActiveTab('mirror')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${activeTab === 'mirror' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                    <Sparkles className="w-3 h-3" /> Mirror
                 </button>
                 <button onClick={() => setActiveTab('privacy')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${activeTab === 'privacy' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                    <Shield className="w-3 h-3" /> Rights
                 </button>
                 <button onClick={() => setActiveTab('account')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${activeTab === 'account' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                    <MoreVertical className="w-3 h-3" /> Account
                 </button>
              </div>

              {activeTab === 'mirror' ? (
                <>
                  {profile && <SanctuaryMirror profile={profile} onUpdate={handleUpdateIntelligence} />}
                </>
              ) : activeTab === 'privacy' ? (
                <PrivacyTrustCenter />
              ) : activeTab === 'account' ? (
                <div className="flex flex-col gap-4 pt-4">
                    <button 
                      onClick={() => window.open('/api/profile/export', '_blank')}
                      className="w-full text-[13px] text-white/80 hover:text-white font-bold uppercase tracking-widest transition-all px-6 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10"
                    >
                      Export Data
                    </button>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full text-[13px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-widest transition-all px-6 py-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl hover:bg-rose-500/10 mt-6"
                    >
                      Permadelete
                    </button>
                </div>
              ) : (
                <div className="text-center p-8 text-white/30">Select a tab.</div>
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
