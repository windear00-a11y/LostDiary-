'use client';
import { AlertTriangle } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';

export const DeleteAccountModal = ({ isOpen, onClose, onDelete }: { isOpen: boolean; onClose: () => void; onDelete: () => void }) => {
  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      overlayClassName="bg-black/70 backdrop-blur-md"
      contentClassName="bg-[#0a0a0a] border border-rose-500/20"
    >
      <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
      </div>
      <h3 className="text-xl font-serif text-white mb-2 text-center">Permadelete</h3>
      <p className="text-[13px] text-white/60 mb-8 text-center leading-relaxed">
        This will pause all your data and schedule it for permanent deletion. Once confirmed, you will be signed out and your sanctuary will begin its closing ritual.
      </p>
      <button 
        onClick={onDelete}
        className="w-full py-5 bg-rose-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-rose-600"
      >
        Confirm Permadeletion
      </button>
    </BaseModal>
  );
};
