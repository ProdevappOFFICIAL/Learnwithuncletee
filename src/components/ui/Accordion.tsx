import { useState } from 'react';
import type { FaqItem } from '@/types';

export const Accordion = ({ items }: { items: FaqItem[] }) => {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-bold text-ink focus-visible:outline-2 focus-visible:outline-brand-500"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              {item.question}<span aria-hidden="true" className="text-xl text-brand-600">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <p className="max-w-3xl pb-5 pr-8 text-sm leading-relaxed text-muted">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
};