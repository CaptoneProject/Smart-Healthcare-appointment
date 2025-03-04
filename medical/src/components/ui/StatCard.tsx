import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  footer?: string;
  link?: string;
  variant?: 'default' | 'success' | 'warning';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  footer, 
  link,
  className = ''
}) => (
  <div className={`relative overflow-hidden backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 
    shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.15)] 
    transition-all duration-300 group ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
    <div className="relative">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-400/10 backdrop-blur-sm">
              <Icon className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="ml-3 text-sm font-medium text-gray-300">{title}</h3>
          </div>
          <div className="mt-4 text-2xl font-semibold text-white/90">{value}</div>
        </div>
      </div>
      {footer && link && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <a 
            href={link} 
            className="flex items-center text-sm text-blue-400 hover:text-blue-300 group-hover:translate-x-1 transition-all"
          >
            {footer}
            <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      )}
    </div>
  </div>
);
