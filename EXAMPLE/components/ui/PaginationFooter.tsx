"use client";

import React from 'react';

interface PaginationFooterProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export const PaginationFooter = ({ page, limit, total, onPageChange, itemLabel = 'items' }: PaginationFooterProps) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (total === 0) return null;

  return (
    <div className="sticky z-10 bottom-0 left-0 w-full flex items-center justify-between px-4 py-3 bg-white border border-zinc-400/20 rounded-sm">
      <div className="text-xs text-[#6b6b6b]">
        Showing <span className="font-medium text-[#0e0f10]">{(page - 1) * limit + 1}</span> to{' '}
        <span className="font-medium text-[#0e0f10]">{Math.min(page * limit, total)}</span> of{' '}
        <span className="font-medium text-[#0e0f10]">{total}</span> {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 text-xs font-medium bg-zinc-50 text-[#0e0f10] border border-zinc-400/20 rounded-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Previous
        </button>
        <span className="text-xs text-[#6b6b6b] px-2">
          Page <span className="font-medium text-[#0e0f10]">{page}</span> of{' '}
          <span className="font-medium text-[#0e0f10]">{totalPages}</span>
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 text-xs font-medium bg-zinc-50 text-[#0e0f10] border border-zinc-400/20 rounded-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
};
