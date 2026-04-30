import { FC, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  contentClassName?: string;
}

export const BaseModal: FC<BaseModalProps> = ({ 
  isOpen, 
  onClose, 
  children,
  overlayClassName = "bg-black/50 backdrop-blur-sm",
  contentClassName = "bg-[#1A1A1D] border border-white/10"
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[100] flex items-center justify-center p-6 ${overlayClassName}`}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative ${contentClassName}`}
          >
            <button onClick={onClose} aria-label="Close" className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
