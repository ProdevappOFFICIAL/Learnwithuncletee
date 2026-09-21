import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/paths';

const cards = [
  { icon: '📖', title: 'Simplified Lessons', text: 'Bite-size explanations for every topic in the primary & secondary curriculum.' },
  { icon: '📝', title: 'Exam Prep Tools', text: 'WAEC, NECO, JAMB & Common Entrance practice with marking guides.' },
  { icon: '❓', title: 'Practice Questions', text: '1000+ auto-marked questions with instant feedback and solutions.' },
  { icon: '🧠', title: 'Study Strategies', text: 'Timetables, memory techniques and revision frameworks that work.' },
];

export const StudentsPage = () => (
  <Layout>
    <section className="bg-amber-50/60 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Badge tone="amber">🎒 Student Portal</Badge>
        <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Learn smarter, score higher.
        </h1>
        <p className="mt-3 max-w-xl text-lg text-slate-600">
          Direct access to simplified lessons, exam prep, practice questions and study guides.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to={ROUTES.resources} variant="secondary">Start Practicing →</Button>
          <Button variant="outline">Download Study Timetable</Button>
        </div>
      </div>
    </section>
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.title} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">{c.icon}</span>
          <h3 className="mt-3 font-extrabold text-slate-900">{c.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.text}</p>
        </div>
      ))}
    </section>
  </Layout>
);
