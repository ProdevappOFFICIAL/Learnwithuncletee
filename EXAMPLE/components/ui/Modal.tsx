"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { BiX } from 'react-icons/bi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center ">
      <div
        className="absolute inset-0 bg-[#1B2559]/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[550px] bg-white rounded shadow shadow-blue-900/20 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-400/20">
          <h2 className="text-xs font-medium text-black tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-sm flex items-center justify-center rounded-full bg-[#F4F7FF] text-[#A3AED0] hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <BiX />
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
