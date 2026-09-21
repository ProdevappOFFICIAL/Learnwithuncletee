import { Link } from 'react-router-dom';
import { personas } from '@/data/personas';
import { SectionHeading } from '@/components/ui/SectionHeading';

export const PersonaGrid = () => (
  <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
    <SectionHeading
      eyebrow="Choose your path"
      title="One portal, tailored for you"
      text="Persona-driven navigation for primary and secondary education workflows. Pick your portal to get started."
    />
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {personas.map((p) => (
        <Link
          key={p.id}
          to={p.path}
          className={`group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm ring-2 ring-transparent transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl ${p.accent.ring}`}
        >
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${p.accent.bg}`}>
            {p.icon}
          </div>
          <p className={`text-xs font-bold uppercase tracking-wider ${p.accent.text}`}>{p.tagline}</p>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900">{p.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.description}</p>
          <ul className="mt-4 space-y-1.5">
            {p.points.map((pt) => (
              <li key={pt} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-emerald-500">✓</span> {pt}
              </li>
            ))}
          </ul>
          <span className={`mt-5 inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold ${p.accent.soft} ${p.accent.text} transition-transform group-hover:translate-x-1`}>
            {p.cta} →
          </span>
        </Link>
      ))}
    </div>
  </section>
);
