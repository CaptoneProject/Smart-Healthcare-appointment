import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-2xl mx-4 backdrop-blur-xl bg-white/5 rounded-xl 
        border border-white/10 p-6 shadow-xl ${className}`}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
        <div className="relative">
          <h2 className="text-xl font-semibold mb-4 text-white/90">{title}</h2>
          {children}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white/90 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
