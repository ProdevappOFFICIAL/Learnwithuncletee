export const StarRating = ({ value = 5 }: { value?: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < value ? 'text-amber-400' : 'text-slate-200'}>
        ★
      </span>
    ))}
  </div>
);
