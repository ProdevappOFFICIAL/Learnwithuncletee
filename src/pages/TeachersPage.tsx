import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/paths';

const items = [
  { icon: '📋', title: 'Lesson Plans', text: 'Ready-to-teach weekly plans aligned to the curriculum with objectives & activities.' },
  { icon: '🎨', title: 'Classroom Aids', text: 'Charts, flashcards, slides and visual aids to boost engagement.' },
  { icon: '💡', title: 'Topic Ideas', text: 'Fresh project ideas, debate topics and assignment prompts per subject.' },
  { icon: '🎓', title: 'Professional Growth', text: 'CPD guides, teaching methods and classroom management playbooks.' },
];

export const TeachersPage = () => (
  <Layout>
    <section className="bg-sky-50/70 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Badge tone="sky">📚 Teacher Portal</Badge>
        <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">Teach with less stress, more impact.</h1>
        <p className="mt-3 max-w-xl text-lg text-slate-600">Downloadable plans, teaching aids and professional development resources.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to={ROUTES.resources} variant="primary">Download Lesson Plans →</Button>
          <Button variant="outline">Explore Teaching Aids</Button>
        </div>
      </div>
    </section>
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((c) => (
        <div key={c.title} className="rounded-3xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-2xl">{c.icon}</span>
          <h3 className="mt-3 font-extrabold">{c.title}</h3>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{c.text}</p>
        </div>
      ))}
    </section>
  </Layout>
);
