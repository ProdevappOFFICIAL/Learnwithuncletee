import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white rounded shadow  border border-zinc-400/20 overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`p-6 border-b border-zinc-400/20 ${className}`}>{children}</div>
);

export const CardContent = ({ children, className = '' }: CardProps) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }: CardProps) => (
  <div className={`p-6 border-t border-zinc-400/20 ${className}`}>{children}</div>
);
