import React, { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Portal the modal directly to the body
  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className={`relative w-full max-w-md mx-4 bg-slate-900 rounded-xl 
        border border-white/10 p-6 shadow-xl ${className}`}
      >
        {title && <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>}
        <X
          className="absolute top-4 right-4 text-white/60 hover:text-white cursor-pointer"
          onClick={onClose}
        />
        {children}
      </div>
    </div>,
    document.body
  );
};