import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className = '', ...props }: InputProps) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className=" text-[#1B2559] ml-1">
          {label}
        </label>
      )}
      <input
        className={`mt-2 w-full h-[40px] px-4 rounded-[12px] text-[#1B2559] bg-white border border-[#D0D5DD] text-[14px] 
          placeholder:text-[#A3AED0] focus:outline-none focus:ring-2 focus:ring-blue-500/20 
          transition-all duration-200 ${error ? 'border-red-500 ring-red-500/20' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-[12px] text-red-500 ml-1">{error}</p>}
    </div>
  );
};
