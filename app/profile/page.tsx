'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { coreService, UserProfile, IntelligenceProfile } from '@/lib/services/core-service';
import { getGenAI } from '@/lib/genai';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { motion, AnimatePresence } from 'motion/react';
import { User, Camera, Sparkles, LogOut, Save, Edit2, Shield, Send, Book, Handshake, ChevronRight, MessageSquare, Heart, ChevronDown, ChevronUp, MoreVertical, Trash2, ExternalLink, BookOpen } from 'lucide-react';
import { DeleteAccountModal } from '@/components/profile/DeleteAccountModal';
import { FeedbackDrawer } from '@/components/ui/FeedbackDrawer';
import { Header } from '@/components/ui/Header';
import { SanctuaryMirror } from '@/components/profile/SanctuaryMirror';
import { AuthorHeartbeat } from '@/components/profile/AuthorHeartbeat';
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
  const [activeTab, setActiveTab] = useState<'general' | 'mirror' | 'energy' | 'bridges' | 'treasury' | 'privacy'>('general');
  const [inboxPlanes, setInboxPlanes] = useState<any[]>([]);
  const [bridges, setBridges] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [volumes, setVolumes] = useState<any[]>([]);

  // UX Patterns State
  const [expandedPlanes, setExpandedPlanes] = useState<Set<string>>(new Set());
  const [expandedLegacy, setExpandedLegacy] = useState<Set<string>>(new Set());
  const [bridgeConfirmSheet, setBridgeConfirmSheet] = useState<{ open: boolean, plane: any | null }>({ open: false, plane: null });

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
      
      const [planesRes, bridgesRes, chaptersData, volumesData] = await Promise.all([
         fetch('/api/profile/planes'),
         fetch('/api/bridge/list'),
         coreService.fetchChapters(user.id),
         coreService.fetchVolumes(user.id)
      ]);
      
      if (planesRes.ok) {
        const planesData = await planesRes.json();
        setInboxPlanes(planesData.planes || []);
      }
      if (bridgesRes.ok) {
        const bridgesData = await bridgesRes.json();
        setBridges(bridgesData.bridges || []);
      }
      setChapters(chaptersData);
      setVolumes(volumesData);
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

      const promptResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these diary entries, describe a symbolic, artistic, and abstract avatar that represents this person's personality and current emotional state. Keep the description concise and visual.
        
        Entries:
        ${recentContext}
        
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
          avatar_url: publicUrl,
          personality_summary: visualPrompt
        });
        setProfile(updated);
        toast.success("AI Avatar manifested from your thoughts.");
      }
    } catch (error) {
      console.error("Error generating avatar:", error);
      setError("AI generation failed. Please try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlane = (id: string) => {
    setExpandedPlanes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLegacy = (id: string) => {
    setExpandedLegacy(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAcceptPlane = async (plane: any) => {
    setBridgeConfirmSheet({ open: true, plane });
  };

  const confirmBridge = async () => {
    const plane = bridgeConfirmSheet.plane;
    if (!plane) return;
    try {
      const res = await fetch('/api/profile/planes/accept', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ planeId: plane.id }) 
      });
      const data = await res.json();
      if (data.success) {
        setInboxPlanes(curr => curr.filter(p => p.id !== plane.id));
        setBridgeConfirmSheet({ open: false, plane: null });
        router.push(`/bridge/${data.bridgeId}`);
      }
    } catch (e) {
      toast.error("Failed to build bridge.");
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
      <Header />
      
      <SuccessMoment 
        isOpen={showSuccessMoment} 
        onClose={() => setShowSuccessMoment(false)}
        title="Identity Refined"
        subtitle="Your presence in the sanctuary has been updated."
        type="save"
      />

      <BottomSheet
        isOpen={bridgeConfirmSheet.open}
        onClose={() => setBridgeConfirmSheet({ open: false, plane: null })}
        title="Build a Soul Bridge?"
        subtitle={`Connecting with ${bridgeConfirmSheet.plane?.sender?.pen_name}. This will establish a persistent and private link between your sanctuaries.`}
      >
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-serif italic leading-relaxed">
            &quot;A bridge is more than a path; it is a shared space of trust. Conversations here are protected by the sanctuary's silence.&quot;
          </div>
          
          <div className="space-y-3">
             <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 opacity-60">
                <Shield className="w-5 h-5 text-slate-400" />
                <div>
                   <p className="text-[10px] font-bold uppercase text-slate-500">Connection Mode</p>
                   <p className="text-sm font-medium">Standard Protected (Fully Anonymous)</p>
                </div>
             </div>
          </div>

          <button 
             onClick={confirmBridge}
             className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
             Confirm and Open Bridge <Handshake className="w-4 h-4" />
          </button>
        </div>
      </BottomSheet>
      
      <main className="max-w-2xl mx-auto px-6 pt-24 perspective-1000">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-sm text-rose-600 dark:text-rose-400 text-center font-serif italic"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'general' ? (
            <motion.div 
              key="front"
              initial={{ opacity: 0, rotateY: -10 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 10 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-[#1A1A1D] rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-white/5"
            >
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5 border-4 border-white dark:border-[#1A1A1D] shadow-xl relative">
                    {profile?.avatar_url ? (
                      <Image 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        fill 
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                    className="absolute -bottom-2 -right-2 p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                    title="Generate AI Avatar"
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="mt-4 text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Anonymous Avatar
                </p>
              </div>

              {/* Info Section */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Personal Display Name</label>
                    <button 
                      onClick={() => { if(isEditing) handleSaveProfile(); setIsEditing(!isEditing); }}
                      className="text-indigo-500 hover:underline text-sm flex items-center gap-1"
                    >
                      {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                  </div>
                  {isEditing ? (
                    <input 
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Your private name..."
                    />
                  ) : (
                    <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                      {profile?.display_name || user?.email?.split('@')[0] || 'Unknown'}
                    </h2>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Visible only to you and WinDear.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-indigo-500/80">Pen Name & Tag (For the Library)</label>
                  </div>
                  
                  {isEditing ? (
                    <input 
                      type="text"
                      value={penName}
                      onChange={(e) => setPenName(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      placeholder="E.g., The Midnight Thinker"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-serif font-medium text-gray-900 dark:text-gray-100">
                        {profile?.pen_name || 'Anonymous Author'}
                      </h2>
                      {profile?.pen_name_tag && (
                        <span className="bg-indigo-500/10 text-indigo-500 font-mono text-sm px-2 py-1 rounded-lg">
                          #{profile.pen_name_tag}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">This is how you will uniquely be known if you publish stories to the Global Library.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Author&apos;s Bio</label>
                  {isEditing ? (
                    <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl outline-none focus:border-indigo-500 transition-colors resize-none h-24"
                      placeholder="Write a little about the mind behind the stories..."
                    />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed italic font-serif">
                      {profile?.bio || "A silent observer writing their way through life."}
                    </p>
                  )}
                </div>

                {profile?.personality_summary && (
                  <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">AI Insight</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {profile.personality_summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Portal Button */}
              <div className="mt-12">
                <button
                  onClick={() => setActiveTab('mirror')}
                  className="w-full relative overflow-hidden group rounded-2xl p-6 bg-gray-900 dark:bg-black border border-gray-800 hover:border-gray-700 transition-all shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-rose-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="flex items-center justify-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    <span className="text-gray-300 font-serif text-lg group-hover:text-white transition-colors">Step into The Mirror</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">View the deep intelligence WinDear has gathered about your subconscious.</p>
                </button>
              </div>

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center gap-2 p-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-colors font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="back"
              initial={{ opacity: 0, rotateY: 10 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -10 }}
              transition={{ duration: 0.4 }}
              className="bg-gray-50 dark:bg-[#0A0A0B] rounded-[32px] p-8 shadow-2xl border border-gray-200 dark:border-gray-800"
            >
              <button 
                onClick={() => setActiveTab('general')}
                className="mb-8 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
              >
                ← Return to Surface
              </button>
              
              {/* Sub-Switcher */}
              <div className="flex gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar border-b border-gray-200 dark:border-white/5">
                 <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'general' ? 'bg-white dark:bg-white/10 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                    <User className="w-3 h-3" /> Identity
                 </button>
                 <button onClick={() => setActiveTab('mirror')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'mirror' ? 'bg-white dark:bg-white/10 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                    <Shield className="w-3 h-3" /> Mirror
                 </button>
                 <button onClick={() => setActiveTab('energy')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'energy' ? 'bg-white dark:bg-white/10 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                    <Sparkles className="w-3 h-3" /> Energy Jar
                 </button>
                 <button onClick={() => setActiveTab('treasury')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'treasury' ? 'bg-white dark:bg-white/10 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                    <Book className="w-3 h-3" /> Legacy
                 </button>
                 <button onClick={() => setActiveTab('bridges')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'bridges' ? 'bg-white dark:bg-white/10 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                    <Handshake className="w-3 h-3" /> Bridges
                 </button>
                 <button onClick={() => setActiveTab('privacy')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'privacy' ? 'bg-white dark:bg-white/10 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                    <Shield className="w-3 h-3" /> Rights
                 </button>
              </div>

              {activeTab === 'mirror' ? (
                <>
                  {profile && <SanctuaryMirror profile={profile} onUpdate={handleUpdateIntelligence} />}
                </>
              ) : activeTab === 'energy' ? (
                <AuthorHeartbeat />
              ) : activeTab === 'privacy' ? (
                <PrivacyTrustCenter />
              ) : activeTab === 'treasury' ? (
                <div className="space-y-12">
                   {/* Paper Planes Section - Pattern 3: Accordion */}
                   <div>
                      <div className="flex items-center gap-2 mb-6">
                         <Send className="w-5 h-5 text-indigo-500" />
                         <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white">Paper Planes</h3>
                      </div>
                      
                      {inboxPlanes.length === 0 ? (
                         <div className="p-10 bg-white/20 dark:bg-white/[0.02] border border-dashed border-gray-300 dark:border-white/10 rounded-[32px] text-center">
                            <Send className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                            <p className="text-sm text-gray-500 font-serif italic">Your window is open, waiting for a soul-signal.</p>
                         </div>
                      ) : (
                         <div className="grid grid-cols-1 gap-4">
                            {inboxPlanes.map(plane => {
                               const isExpanded = expandedPlanes.has(plane.id);
                               return (
                                 <div 
                                   key={plane.id} 
                                   className={`bg-white dark:bg-[#111] rounded-[24px] border transition-all ${isExpanded ? 'border-indigo-500/30 ring-4 ring-indigo-500/5' : 'border-gray-200 dark:border-white/10 shadow-sm'} overflow-hidden`}
                                 >
                                    <div 
                                      onClick={() => togglePlane(plane.id)}
                                      className="p-6 cursor-pointer flex justify-between items-center"
                                    >
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                             <User className="w-4 h-4 text-indigo-500" />
                                          </div>
                                          <div>
                                             <div className="text-[10px] uppercase tracking-widest text-gray-400">From</div>
                                             <div className="text-sm font-bold">{plane.sender.pen_name} <span className="text-gray-400 font-mono text-[10px]">#{plane.sender.pen_name_tag}</span></div>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <span className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(plane.created_at).toLocaleDateString()}</span>
                                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                       </div>
                                    </div>

                                    <AnimatePresence>
                                       {isExpanded && (
                                          <motion.div 
                                             initial={{ height: 0, opacity: 0 }}
                                             animate={{ height: 'auto', opacity: 1 }}
                                             exit={{ height: 0, opacity: 0 }}
                                             className="px-6 pb-6"
                                          >
                                             <p className="text-sm font-serif text-gray-700 dark:text-gray-300 leading-relaxed italic p-4 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-white/5 mb-4">
                                                &quot;{plane.content}&quot;
                                             </p>
                                             <button
                                                onClick={() => handleAcceptPlane(plane)}
                                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl hover:scale-[1.01] active:scale-95"
                                             >
                                                Build The Bridge
                                             </button>
                                          </motion.div>
                                       )}
                                    </AnimatePresence>
                                 </div>
                               );
                            })}
                         </div>
                      )}
                   </div>

                   {/* Legacy Section - Pattern 3 & 4 */}
                   <div>
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-2">
                            <Book className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white">Your Legacy</h3>
                         </div>
                      </div>
                      
                      {chapters.length === 0 ? (
                         <div className="p-10 bg-white/20 dark:bg-white/[0.02] border border-dashed border-gray-300 dark:border-white/10 rounded-[32px] text-center">
                            <p className="text-sm text-gray-500 font-serif italic">The book of your soul remains unauthored.</p>
                         </div>
                      ) : (
                         <div className="grid grid-cols-1 gap-4">
                            {chapters.map(chapter => {
                               const isExpanded = expandedLegacy.has(chapter.id);
                               return (
                                 <div key={chapter.id} className={`bg-white dark:bg-[#111] rounded-[24px] border transition-all ${isExpanded ? 'border-indigo-500/30' : 'border-gray-200 dark:border-white/10 shadow-sm'} overflow-hidden`}>
                                    <div 
                                      onClick={() => toggleLegacy(chapter.id)}
                                      className="p-6 cursor-pointer flex justify-between items-center group"
                                    >
                                       <div>
                                          <h4 className="font-serif font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-500 transition-colors">{chapter.title}</h4>
                                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(chapter.created_at).toLocaleDateString()}</p>
                                       </div>
                                       <div className="flex items-center gap-3">
                                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                                       </div>
                                    </div>

                                    <AnimatePresence>
                                       {isExpanded && (
                                          <motion.div 
                                             initial={{ height: 0, opacity: 0 }}
                                             animate={{ height: 'auto', opacity: 1 }}
                                             exit={{ height: 0, opacity: 0 }}
                                             className="px-6 pb-6"
                                          >
                                             <div className="prose prose-slate dark:prose-invert text-xs font-serif leading-loose italic text-gray-600 dark:text-gray-400 bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5 mb-4 max-h-48 overflow-y-auto">
                                                {chapter.content}
                                             </div>
                                             <div className="flex gap-2">
                                                <button 
                                                  onClick={() => { setActiveView('story'); router.push('/home'); }}
                                                  className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                   <BookOpen className="w-3 h-3" /> Read in Volume
                                                </button>
                                                <button className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-rose-500 rounded-xl transition-colors">
                                                   <Trash2 className="w-3 h-3" />
                                                </button>
                                             </div>
                                          </motion.div>
                                       )}
                                    </AnimatePresence>
                                 </div>
                               );
                            })}
                         </div>
                      )}
                   </div>
                </div>
              ) : activeTab === 'bridges' ? (
                <div className="space-y-6">
                   <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                         <Handshake className="w-5 h-5 text-indigo-500" />
                         <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white">Soul Connections</h3>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                         Live
                      </span>
                   </div>

                   {bridges.length === 0 ? (
                      <div className="p-12 text-center bg-white/20 dark:bg-white/[0.02] rounded-[32px] border border-dashed border-gray-300 dark:border-white/10">
                         <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                         <p className="text-sm text-gray-500 font-serif italic mb-6">You have no active bridges. Send a paper plane to start a connection.</p>
                         <button onClick={() => setActiveTab('treasury')} className="px-6 py-3 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">Check Inbox</button>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         {bridges.map(bridge => (
                            <div 
                               key={bridge.id} 
                               onClick={() => router.push(`/bridge/${bridge.id}`)}
                               className="p-5 bg-white dark:bg-[#111] rounded-[24px] border border-gray-200 dark:border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer group flex items-center justify-between shadow-sm"
                            >
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                                     <User className="w-6 h-6 text-indigo-400" />
                                  </div>
                                  <div>
                                     <div className="flex items-baseline gap-2">
                                        <span className="font-serif font-bold text-gray-900 dark:text-white group-hover:text-indigo-400 transition-colors">{bridge.other.pen_name}</span>
                                        <span className="text-[10px] font-mono text-gray-400">#{bridge.other.pen_name_tag}</span>
                                     </div>
                                     <div className="flex items-center gap-2 mt-0.5">
                                        <div className={`text-[10px] uppercase tracking-tighter px-1.5 py-0.5 rounded ${bridge.mode === 'protected' ? 'bg-indigo-500/10 text-indigo-400' : bridge.mode === 'trusted' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                           {bridge.mode}
                                        </div>
                                        <span className="text-[9px] text-gray-400">{new Date(bridge.updated_at).toLocaleDateString()}</span>
                                     </div>
                                  </div>
                               </div>
                               <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-all" />
                            </div>
                         ))}
                      </div>
                   )}
                </div>
              ) : (
                <PrivacyTrustCenter />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10 text-center flex flex-col items-center gap-6">
            <button 
              onClick={() => window.open('/api/profile/export', '_blank')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-all px-4 py-2 border border-indigo-500/20 rounded-full hover:bg-indigo-500/10"
            >
              Export My Vault Data
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-widest transition-all"
            >
              Delete Sanctuary Forever
            </button>
        </div>

        <DeleteAccountModal 
          isOpen={showDeleteModal} 
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDeleteAccount}
        />
        
        <FeedbackDrawer />

        <p className="text-center mt-8 text-xs text-gray-400 dark:text-gray-600">
          Your deep data never leaves the Mirror. Only your Pen Name and Avatar are seen in the Global Library.
        </p>
      </main>
    </div>
  );
}
