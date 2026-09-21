import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/paths';

const toolkits = [
  { icon: '🗺️', title: 'Guided Learning Frameworks', text: 'Step-by-step term plans by class level — know exactly what to revise weekly.' },
  { icon: '🧰', title: 'Home-Support Toolkits', text: 'Checklists, homework helpers and reading routines for busy parents.' },
  { icon: '📊', title: 'Progress Tracking', text: 'Simple score sheets and milestone trackers to spot gaps early.' },
];

export const ParentsPage = () => (
  <Layout>
    <section className="bg-emerald-50/70 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Badge tone="emerald">🏠 Parent Portal</Badge>
        <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">Support your child with confidence.</h1>
        <p className="mt-3 max-w-xl text-lg text-slate-600">Frameworks, toolkits and tracking resources to actively guide learning at home.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to={ROUTES.resources} variant="primary">Get Home Toolkit →</Button>
          <Button variant="outline">View Sample Tracker</Button>
        </div>
      </div>
    </section>
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 md:grid-cols-3">
      {toolkits.map((t) => (
        <div key={t.title} className="rounded-3xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">{t.icon}</span>
          <h3 className="mt-3 font-extrabold">{t.title}</h3>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{t.text}</p>
        </div>
      ))}
    </section>
  </Layout>
);
