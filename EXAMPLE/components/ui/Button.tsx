import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading,
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center  transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white  shadow-blue-500/20 hover:shadow-blue-500/30',
    secondary: 'bg-[#1B2559] text-white hover:bg-[#1B2559]/90',
    outline: 'bg-transparent border border-[#E0E5F2] text-[#1B2559] hover:bg-gray-50',
    ghost: 'bg-transparent text-[#A3AED0] hover:text-[#1B2559] hover:bg-[#F4F7FF]',
  };

  const sizes = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-2 px-6 text-md',
    lg: 'py-2 px-8 text-sm',
    xl: 'py-2 px-10 text-xl',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
