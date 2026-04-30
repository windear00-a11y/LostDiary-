'use client';
import { Lock } from 'lucide-react';
import { authService } from '@/lib/services/auth-service';
import { BaseModal } from '@/components/ui/BaseModal';

export const AuthPromptModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-xl font-serif font-bold text-white mb-2 text-center">Apne dil ki baat mehfuz rakhein</h3>
      <p className="text-sm text-gray-400 mb-8 text-center leading-relaxed">
        Apni thoughts ko hamesha ke liye protect karne ke liye, chaliye ek chhota sa private vault (account) banate hain.
      </p>
      <button 
        onClick={() => authService.signInWithGoogle()}
        className="w-full py-4 bg-white text-black hover:bg-white/90 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
      >
        Google se Login karein
      </button>
    </BaseModal>
  );
};
