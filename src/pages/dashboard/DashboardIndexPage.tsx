import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { Container } from '@/components/ui/Container';
import { PageMetadata } from '@/components/ui/PageMetadata';

const portals = [
  { to: ROUTES.studentDashboard, title: 'Student Portal', text: 'Dashboard · Fees · Results · Assignments · Virtual Class', initials: 'ST', bg: 'bg-brand-500' },
  { to: ROUTES.teacherDashboard, title: 'Teacher Portal', text: 'Dashboard · Assignments · Results · My Classes', initials: 'TE', bg: 'bg-brand-900' },
  { to: ROUTES.adminDashboard, title: 'Admin Portal', text: 'Students · Staff · Admissions · Fees · News · Settings', initials: 'AD', bg: 'bg-lime-accent' },
];

export const DashboardIndexPage = () => (
  <main className="min-h-screen bg-cream py-14">
    <PageMetadata title="Portals" description="Choose your Learnwithuncletee portal." />
    <Container>
      <Link to={ROUTES.home} className="inline-flex items-center gap-2">
        <img src="/logo.png" alt="" className="h-10 w-10 rounded-full border border-line object-cover" />
        <span className="font-display font-extrabold">Learnwithuncletee</span>
      </Link>
      <p className="mt-8 inline-flex items-center border-l-2 border-brand-500 pl-3 text-xs font-bold uppercase tracking-widest text-brand-700">Portals</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Choose your portal</h1>
      <p className="mt-2 max-w-xl text-muted">Sign-in routes here after authentication is connected. For now, pick a portal to preview its sidebar and pages.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {portals.map((p) => (
          <Link key={p.to} to={p.to} className="border border-line bg-white p-6 hover:border-brand-500">
            <span className={`flex h-12 w-12 items-center justify-center rounded-full font-display text-sm font-extrabold ${p.bg} ${p.bg === 'bg-lime-accent' ? 'text-brand-900' : 'text-white'}`}>{p.initials}</span>
            <h2 className="mt-4 font-display text-xl font-extrabold">{p.title}</h2>
            <p className="mt-1 text-sm text-muted">{p.text}</p>
            <span className="mt-4 inline-block text-sm font-bold text-brand-700">Open portal →</span>
          </Link>
        ))}
      </div>
    </Container>
  </main>
);
