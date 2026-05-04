'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { coreService, UserProfile } from '@/lib/services/core-service';
import { getGenAI } from '@/lib/genai';
import { LoadingSpace } from '@/components/ui/LoadingSpace';
import { motion, AnimatePresence } from 'motion/react';
import { User, Camera, Sparkles, LogOut, Save, Edit2, Shield, Send, Book, Handshake, ChevronRight, MessageSquare, Heart, ChevronDown, ChevronUp, MoreVertical, Trash2, ExternalLink, BookOpen, Activity } from 'lucide-react';
import { DeleteAccountModal } from '@/components/profile/DeleteAccountModal';
import { FeedbackDrawer } from '@/components/ui/FeedbackDrawer';
import { InsightDashboard } from '@/components/profile/InsightDashboard';
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
    // Left for future identity fields
    setIsEditing(false);
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpace />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 pb-32 relative overflow-x-hidden">
      {/* Background Atmosphere */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-in-out opacity-40 blur-[100px] z-0"
        style={{ 
          background: 'radial-gradient(circle at 50% 0%, var(--color-accent-amber) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(255, 158, 94, 0.05) 0%, transparent 50%)' 
        }}
      />

      <div className="relative z-10">
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
              className="bg-[var(--color-bg-dark)]/80 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-white/5 glass-surface"
            >
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-10">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[32px] overflow-hidden bg-white/5 border border-[var(--color-accent-amber)]/20 shadow-[0_0_30px_rgba(245,158,11,0.1)] flex items-center justify-center text-[var(--color-accent-amber)]/40 relative">
                    <User className="w-12 h-12" />
                  </div>
                </div>
                
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary-text-dark)]">
                  {user?.email || 'Anonymous Observer'}
                </p>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                 <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Activity className="w-5 h-5 text-[var(--color-accent-amber)]/60" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary-text-dark)]">Awareness Score</p>
                    <p className="text-3xl font-serif text-[var(--color-primary-text-dark)]">{profile?.awareness_score || 0}</p>
                 </div>
                 <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Activity className="w-5 h-5 text-[var(--color-accent-amber)]/60" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary-text-dark)]">Reaction Ratio</p>
                    <p className="text-3xl font-serif text-[var(--color-primary-text-dark)]">{profile?.reaction_ratio || '0.0'}</p>
                 </div>
              </div>

              {/* Portal Button */}
              <div className="mt-10">
                <button
                  onClick={() => setActiveProfileTab('mirror')}
                  className="w-full group rounded-2xl py-4 px-6 bg-[var(--color-accent-amber)]/5 border border-[var(--color-accent-amber)]/10 hover:bg-[var(--color-accent-amber)]/10 hover:border-[var(--color-accent-amber)]/20 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[var(--color-accent-amber)]" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent-amber)]/70 group-hover:text-[var(--color-accent-amber)]">View Deep Insights</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-accent-amber)] opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              {/* Actions */}
              <div className="mt-10 pt-6 border-t border-white/5">
                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center gap-3 p-4 text-[var(--color-secondary-text-dark)]/60 hover:text-[var(--color-secondary-text-dark)] hover:bg-white/5 rounded-2xl transition-colors font-bold uppercase tracking-widest text-xs"
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
              className="bg-[var(--color-bg-dark)]/80 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-white/5 glass-surface"
            >
              {activeProfileTab === 'mirror' ? (
                <InsightDashboard />
              ) : activeProfileTab === 'vault' ? (
                <div className="space-y-10">
                   <PrivacyTrustCenter />
                   
                   <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary-text-dark)]/60 px-2">Account Management</h4>
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

        <DeleteAccountModal 
          isOpen={showDeleteModal} 
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDeleteAccount}
        />
        
        <FeedbackDrawer />

        <p className="text-center mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary-text-dark)]/40 mb-8">
          Self-Awareness Operating System
        </p>
      </main>
      </div>
    </div>
  );
}

