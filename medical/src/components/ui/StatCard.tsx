import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  change?: { value: string; positive: boolean };
  linkTo?: string;
  footer?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title,
  value,
  icon: Icon,
  description,
  change,
  linkTo,
  footer,
  onClick,
  isLoading
}) => {
  // Create a div wrapper with onClick instead of passing it to Card
  return (
    <div 
      className={onClick ? 'cursor-pointer' : ''}
      onClick={onClick}
    >
      <Card className={onClick ? 'hover:bg-white/5 transition-colors' : ''}>
        <div className="relative overflow-hidden backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 
          shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.15)] 
          transition-all duration-300 group">
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
                <div className="mt-4 text-2xl font-semibold text-white/90">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-white/10 animate-pulse rounded"></div>
                  ) : (
                    value
                  )}
                </div>
                {description && (
                  <p className="mt-1 text-sm text-white/60">{description}</p>
                )}
                {change && (
                  <div className={`mt-2 text-sm ${change.positive ? 'text-green-400' : 'text-red-400'}`}>
                    {change.positive ? '↑' : '↓'} {change.value}
                  </div>
                )}
              </div>
            </div>
            
            {footer && linkTo && (
              <div className="mt-4 pt-4 border-t border-white/5">
                {/* Use Link from react-router for client-side navigation */}
                <Link 
                  to={linkTo} 
                  className="flex items-center text-sm text-blue-400 hover:text-blue-300 group-hover:translate-x-1 transition-all"
                >
                  {footer}
                  <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
