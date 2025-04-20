import React, { ReactNode, ElementType } from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  as?: 'button' | 'link' | ElementType;
  to?: string;
  title?: string;
  icon?: ReactNode; // Add the icon prop
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  as = 'button',
  to = '/',
  title,
  icon, // Add icon to the destructured props
  ...rest
}) => {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'bg-transparent border border-white/20 hover:bg-white/5 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    ghost: 'bg-transparent hover:bg-white/10 text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-5 py-2.5 text-lg',
    icon: 'p-2 w-10 h-10 flex items-center justify-center',
  };

  const baseStyles = `
    rounded-lg
    font-medium
    transition-colors
    focus:outline-none
    focus:ring-2
    focus:ring-offset-1
    focus:ring-blue-500
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `;

  // Show loading spinner if loading is true
  const content = loading ? (
    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
  ) : (
    // If icon exists, render it alongside the content
    <>
      {icon && <span className="mr-2 flex items-center">{icon}</span>}
      {children}
    </>
  );

  // Handle case when 'as' is the Link component itself
  if (as === Link) {
    return (
      <Link to={to} className={`${baseStyles} flex items-center justify-center`} title={title} {...rest}>
        {content}
      </Link>
    );
  }

  // Handle case when 'as' is the string 'link'
  if (as === 'link') {
    return (
      <Link to={to} className={`${baseStyles} flex items-center justify-center`} title={title} {...rest}>
        {content}
      </Link>
    );
  }

  // Handle case when 'as' is a custom component
  if (typeof as !== 'string') {
    const Component = as;
    return (
      <Component to={to} className={`${baseStyles} flex items-center justify-center`} title={title} {...rest}>
        {content}
      </Component>
    );
  }

  // Default case: render a button
  return (
    <button
      type={type}
      className={`${baseStyles} flex items-center justify-center`}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      {...rest}
    >
      {content}
    </button>
  );
};