import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  children: ReactNode;
  to?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'white' | 'dark';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export const Button = ({ children, to, variant = 'primary', className = '', onClick, type = 'button' }: ButtonProps) => {
  const base =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  const styles: Record<string, string> = {
    primary: 'bg-brand-500 text-white hover:bg-brand-700 focus-visible:ring-brand-500',
    secondary: 'bg-lime-accent text-ink hover:bg-brand-200 focus-visible:ring-lime-accent',
    outline: 'border border-line bg-white text-ink hover:border-brand-500 hover:text-brand-700',
    white: 'bg-white text-brand-700 hover:bg-brand-50 focus-visible:ring-white',
    dark: 'bg-brand-900 text-white hover:bg-brand-700 focus-visible:ring-brand-500',
  };
  const cls = `${base} ${styles[variant]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick}>
      {children}
    </button>
  );
};
