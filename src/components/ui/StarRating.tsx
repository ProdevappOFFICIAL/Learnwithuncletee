import { Star } from 'lucide-react';

export const StarRating = ({ value = 5 }: { value?: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={16} className={i < value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} aria-hidden="true" />
    ))}
  </div>
);
