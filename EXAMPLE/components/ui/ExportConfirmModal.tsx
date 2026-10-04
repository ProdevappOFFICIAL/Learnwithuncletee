"use client";

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Archive, Trash2 } from 'lucide-react';

interface ExportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  itemCountLabel: string;
  onConfirm: (deleteOriginal: boolean) => void;
  isLoading?: boolean;
}

export const ExportConfirmModal = ({
  isOpen,
  onClose,
  title = 'Export to Bank',
  itemCountLabel,
  onConfirm,
  isLoading,
}: ExportConfirmModalProps) => {
  const [deleteOriginal, setDeleteOriginal] = useState(false);

  const handleClose = () => {
    setDeleteOriginal(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-5">
        <p className="text-xs text-[#6b6b6b]">{itemCountLabel}</p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setDeleteOriginal(false)}
            className={`w-full flex items-start gap-3 p-3 rounded-sm border text-left transition-all ${!deleteOriginal ? 'border-blue-500 bg-blue-50/50' : 'border-zinc-400/20 hover:bg-zinc-50'
              }`}
          >
            <Archive size={16} className={!deleteOriginal ? 'text-blue-500' : 'text-[#6b6b6b]'} />
            <div>
              <p className="text-xs font-medium text-[#0e0f10]">Export &amp; Keep Originals</p>
              <p className="text-[11px] text-[#6b6b6b] mt-0.5">Copy the records into the bank, leaving the live data untouched.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDeleteOriginal(true)}
            className={`w-full flex items-start gap-3 p-3 rounded-sm border text-left transition-all ${deleteOriginal ? 'border-red-500 bg-red-50/50' : 'border-zinc-400/20 hover:bg-zinc-50'
              }`}
          >
            <Trash2 size={16} className={deleteOriginal ? 'text-red-500' : 'text-[#6b6b6b]'} />
            <div>
              <p className="text-xs font-medium text-[#0e0f10]">Export &amp; Delete Originals</p>
              <p className="text-[11px] text-[#6b6b6b] mt-0.5">Move the records into the bank and permanently remove them from live data.</p>
            </div>
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-1.5 text-xs text-[#6b6b6b] hover:bg-zinc-100 rounded-sm transition-all border border-zinc-400/20"
          >
            Cancel
          </button>
          <Button
            type="button"
            onClick={() => onConfirm(deleteOriginal)}
            className={`flex-1 py-1.5 text-xs rounded-sm transition-all ${deleteOriginal ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-zinc-700'} text-white`}
            isLoading={isLoading}
          >
            Confirm Export
          </Button>
        </div>
      </div>
    </Modal>
  );
};
