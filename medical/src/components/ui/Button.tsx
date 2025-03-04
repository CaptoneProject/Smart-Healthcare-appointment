import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled = false
}) => {
  const baseClasses = 'rounded-lg font-medium flex items-center justify-center transition-all duration-300';
  
  const variantClasses = {
    primary: 'bg-blue-500/80 backdrop-blur-sm text-white hover:bg-blue-600/80 border border-blue-400/20 shadow-lg',
    secondary: 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border border-white/5',
    outline: 'bg-transparent text-white/60 hover:text-white/90 border border-white/10',
    ghost: 'bg-transparent text-white/60 hover:text-white/90 hover:bg-white/5',
    danger: 'bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-600/80 border border-red-400/20 shadow-lg'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};