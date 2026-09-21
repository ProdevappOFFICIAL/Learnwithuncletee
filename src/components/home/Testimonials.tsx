import { testimonials } from '@/data/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StarRating } from '@/components/ui/StarRating';

export const Testimonials = () => (
  <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
    <SectionHeading
      eyebrow="Social proof"
      title="Loved by students, parents & educators"
      text="Verified community feedback with real results across primary and secondary levels."
    />
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      {testimonials.map((t) => (
        <figure key={t.id} className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
          <StarRating />
          <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-700">“{t.quote}”</blockquote>
          <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
            <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold text-slate-900 ${t.color}`}>
              {t.initials}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{t.name}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">✓ Verified • {t.role}</p>
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
      <span><strong className="text-slate-900">4.9/5</strong> average rating</span>
      <span className="h-1 w-1 rounded-full bg-slate-300" />
      <span><strong className="text-slate-900">3,200+</strong> verified reviews</span>
      <span className="h-1 w-1 rounded-full bg-slate-300" />
      <span><strong className="text-slate-900">92%</strong> report better grades</span>
    </div>
  </section>
);
