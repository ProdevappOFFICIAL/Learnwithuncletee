import { pillars, missionVision } from '@/data/content';
import { SectionHeading } from '@/components/ui/SectionHeading';

export const PillarGrid = () => (
  <section className="bg-slate-50/80 py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Why UncleTee"
        title="Mission, vision & values that drive impact"
        text="We bridge learning gaps with integrity and excellence — for every classroom and home."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/80 via-slate-900 to-slate-900" />
          <div className="relative p-8">
            {missionVision.map((m) => (
              <div key={m.id} className="mb-6 last:mb-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{m.label}</p>
                <h3 className="mt-1 text-2xl font-extrabold">{m.title}</h3>
                <p className="mt-2 text-indigo-100/90 leading-relaxed">{m.text}</p>
              </div>
            ))}
            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-xl font-bold text-slate-900">T</span>
              <div>
                <p className="text-sm font-bold">“Every child can excel with the right guide.”</p>
                <p className="text-xs text-indigo-200">— UncleTee, Founder</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1">👩‍🏫 500+ teachers</span>
              <span className="rounded-full bg-white/15 px-3 py-1">🎓 25k learners</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-1">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">{pillar.icon}</span>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{pillar.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{pillar.text}</p>
              </div>
            </div>
          ))}
          <div className="rounded-3xl bg-amber-300 p-6">
            <p className="font-[cursive] text-lg font-bold text-slate-900">Small steps daily → Big results termly 📈</p>
            <p className="text-sm text-slate-800">Structured curriculum + practice = confident learners.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);
