import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Shield, Lock, FileText, UserCheck } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onDecline
}) => {
  const consentPoints = [
    {
      icon: Lock,
      title: 'Secure Storage',
      description: 'Your records are encrypted and stored securely'
    },
    {
      icon: UserCheck,
      title: 'Controlled Access',
      description: 'Only authorized healthcare providers can access your records'
    },
    {
      icon: FileText,
      title: 'Complete History',
      description: 'Maintain a comprehensive medical history'
    }
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Medical Records Consent"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <Shield className="w-16 h-16 text-blue-500/80" />
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-white/90">
              Your Privacy Matters
            </h3>
            <p className="mt-2 text-white/60">
              Please review and provide consent for medical record access
            </p>
          </div>

          <div className="space-y-4">
            {consentPoints.map((point, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
              >
                <point.icon className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white/90">{point.title}</h4>
                  <p className="text-sm text-white/60">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={onDecline}
            className="w-full"
          >
            Decline
          </Button>
          <Button
            variant="primary"
            onClick={onAccept}
            className="w-full"
          >
            I Consent
          </Button>
        </div>
      </div>
    </Modal>
  );
};