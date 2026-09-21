import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  children: ReactNode;
  to?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  className?: string;
  onClick?: () => void;
}

export const Button = ({ children, to, variant = 'primary', className = '', onClick }: ButtonProps) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  const styles: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 shadow-lg shadow-indigo-200',
    secondary: 'bg-amber-400 text-slate-900 hover:bg-amber-300 focus-visible:ring-amber-400 shadow-lg shadow-amber-100',
    outline: 'border-2 border-slate-200 text-slate-900 hover:border-slate-900 bg-white',
    white: 'bg-white text-indigo-950 hover:bg-indigo-50 shadow-lg',
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
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
};
