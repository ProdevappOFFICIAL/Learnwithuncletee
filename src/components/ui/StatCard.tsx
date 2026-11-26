import type { StatItem } from '@/types';

export const StatCard = ({ item }: { item: StatItem }) => (
  <div className="border-l-2 border-brand-400 px-5 py-2">
    <p className="text-3xl font-extrabold text-brand-700">{item.value}</p>
    <p className="mt-1 text-sm font-medium text-muted">{item.label}</p>
  </div>
);