import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`relative backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 
    shadow-xl hover:bg-white/10 transition-all duration-300 group ${className}`}>
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
    <div className="relative">
      {children}
    </div>
  </div>
);