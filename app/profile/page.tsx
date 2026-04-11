'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { profileService, UserProfile } from '@/lib/services/profile-service';
import { chatService } from '@/lib/services/chat-service';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { User, Camera, Sparkles, Loader2, LogOut, Save, Edit2 } from 'lucide-react';
import { Header } from '@/components/ui/Header';

import Image from 'next/image';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadProfile = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await profileService.getProfile(user.id);
      setProfile(data);
      setDisplayName(data.display_name || '');
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
      const updated = await profileService.updateProfile(user.id, {
        display_name: displayName,
        bio: bio
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save changes. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const generateAIAvatar = async () => {
    if (!user) return;
    try {
      setIsGenerating(true);
      setError(null);
      
      // 1. Get context from diary entries
      const messages = await chatService.fetchMessages(user.id);
      if (messages.length < 3) {
        setError("WinDear needs at least 3 entries to understand your persona.");
        return;
      }

      const recentContext = messages
        .filter(m => m.role === 'user')
        .slice(-10)
        .map(m => m.content)
        .join('\n');

      // 2. Generate prompt using Gemini
      const promptResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these diary entries, describe a symbolic, artistic, and abstract avatar that represents this person's personality and current emotional state. Keep the description concise and visual.
        
        Entries:
        ${recentContext}
        
        Output only the visual description for an image generation tool.`,
      });

      const visualPrompt = promptResponse.text || "A serene and abstract representation of a thoughtful soul, soft colors, ethereal light.";

      // 3. Generate image using Gemini Image model
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
        // 4. Upload and update profile
        const publicUrl = await profileService.uploadAvatar(user.id, base64Image);
        const updated = await profileService.updateProfile(user.id, {
          avatar_url: publicUrl,
          personality_summary: visualPrompt
        });
        setProfile(updated);
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
      <div className="min-h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d] pb-32">
      <Header />
      
      <main className="max-w-2xl mx-auto px-6 pt-24">
        <AnimatePresence>
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-[#2E2E2E]"
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-[#2E2E2E] border-4 border-white dark:border-[#1A1A1A] shadow-xl relative">
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
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button 
                onClick={generateAIAvatar}
                disabled={isGenerating}
                className="absolute -bottom-2 -right-2 p-3 bg-[#6366F1] text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                title="Generate AI Avatar"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
            
            <p className="mt-4 text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
              AI Generated Persona
            </p>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Display Name</label>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-[#6366F1] hover:underline text-sm flex items-center gap-1"
                >
                  {isEditing ? <Save className="w-4 h-4" onClick={handleSaveProfile} /> : <Edit2 className="w-4 h-4" />}
                </button>
              </div>
              
              {isEditing ? (
                <input 
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-[#0d0d0d] border border-gray-100 dark:border-[#2E2E2E] rounded-xl outline-none focus:border-[#6366F1] transition-colors"
                  placeholder="Your name"
                />
              ) : (
                <h2 className="text-2xl font-serif font-medium text-gray-900 dark:text-[#fdfcfb]">
                  {profile?.display_name || user?.email?.split('@')[0] || 'Anonymous'}
                </h2>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Bio</label>
              {isEditing ? (
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-[#0d0d0d] border border-gray-100 dark:border-[#2E2E2E] rounded-xl outline-none focus:border-[#6366F1] transition-colors resize-none h-24"
                  placeholder="Tell WinDear about yourself..."
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed italic font-serif">
                  {profile?.bio || "No bio set yet. Tell WinDear a bit about your journey."}
                </p>
              )}
            </div>

            {profile?.personality_summary && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#6366F1]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">AI Insight</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {profile.personality_summary}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-[#2E2E2E]">
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </motion.div>

        <p className="text-center mt-8 text-xs text-gray-400 dark:text-gray-600">
          Your data is encrypted and private. WinDear only uses it to personalize your experience.
        </p>
      </main>
    </div>
  );
}
