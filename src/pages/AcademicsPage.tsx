import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { SampleNotice } from '@/components/ui/SampleNotice';
import { Accordion } from '@/components/ui/Accordion';
import { academicFaqs } from '@/data/faqs';
import { programmes } from '@/data/programmes';
import { ROUTES } from '@/routes/paths';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Sparkles } from 'lucide-react';

const subjectGroups = [
  { name: 'Languages & Communication', subjects: ['English', 'Languages'] },
  { name: 'Sciences & Technology', subjects: ['Mathematics', 'Sciences', 'ICT'] },
  { name: 'People & Society', subjects: ['Social Sciences', 'Arts'] },
  { name: 'Health & Wellbeing', subjects: ['Physical & Health Education'] },
];
const approaches = ['Practical Learning', 'Project-Based Learning', 'Technology-Enabled Learning', 'Individual Support', 'Examination Preparation'];

export const AcademicsPage = () => (
  <Layout>
    <PageHero eyebrow="Learning" title="Academics at Learnwithuncletee" text="A clear pathway from early learning through primary and secondary education." image="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=85" />
    <section className="py-16 sm:py-20"><Container><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Academic programmes</p><h2 className="mt-3 text-3xl font-extrabold">Learning for every stage</h2><p className="mt-3 text-muted">Each pathway is designed to support development, curiosity and readiness for the next step.</p></div><div className="mt-10 grid gap-5 md:grid-cols-1">{programmes.map((programme) => <article key={programme.id} className="border border-line p-6"><p className="text-xs font-bold uppercase tracking-widest text-brand-700">{programme.level} · {programme.ageRange}</p><h3 className="mt-3 text-xl font-extrabold">{programme.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted">{programme.description}</p><ul className="mt-5 space-y-2">{programme.outcomes.map((outcome) => <li key={outcome} className="flex gap-2 text-sm text-ink"><Check className="shrink-0 text-brand-500" size={16} aria-hidden="true" />{outcome}</li>)}</ul></article>)}</div><div className="mt-5"><SampleNotice>Age ranges, class levels and learning outcomes are sample placeholders pending confirmation.</SampleNotice></div></Container></section>
    <section className="bg-brand-50 py-16 sm:py-20"><Container className="grid gap-10 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Curriculum</p><h2 className="mt-3 text-3xl font-extrabold">A thoughtful approach to learning</h2><p className="mt-4 leading-relaxed text-muted">Our programmes are designed around a structured curriculum and age-appropriate learning goals. Exact curriculum frameworks, examination affiliations and subject combinations should be confirmed by the school before publication.</p><div className="mt-5"><SampleNotice>Curriculum implementation details are intentionally not asserted until officially confirmed.</SampleNotice></div></div><div className="grid gap-px bg-line sm:grid-cols-2">{approaches.map((item) => <div key={item} className="bg-white p-5"><Sparkles className="text-brand-600" size={18} aria-hidden="true" /><h3 className="mt-3 font-bold">{item}</h3><p className="mt-2 text-sm text-muted">Learning experiences that help students apply ideas and build confidence.</p></div>)}</div></Container></section>
    <section className="py-16 sm:py-20"><Container><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Subjects & resources</p><h2 className="mt-3 text-3xl font-extrabold">A broad foundation</h2><p className="mt-4 text-muted">Subject offerings vary by programme and class level. Confirm the current subject list with the academic office.</p></div><div className="grid gap-4 sm:grid-cols-2">{subjectGroups.map((group) => <article key={group.name} className="border-t border-line pt-4"><h3 className="font-bold">{group.name}</h3><p className="mt-2 text-sm text-muted">{group.subjects.join(' · ')}</p></article>)}</div></div><div className="mt-10 border-y border-line py-7"><h3 className="text-lg font-bold">Academic resources</h3><p className="mt-2 text-sm text-muted">Library, ICT facilities, laboratories and dedicated study spaces support classroom learning. Facility details are pending confirmation.</p></div></Container></section>
    <section className="bg-cream py-16 sm:py-20"><Container className="grid gap-10 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Frequently asked questions</p><h2 className="mt-3 text-3xl font-extrabold">Academic FAQs</h2><p className="mt-3 text-sm text-muted">For specific class or curriculum questions, please contact the school office.</p><Link to={ROUTES.contact} className="mt-5 inline-flex items-center gap-2 font-bold text-brand-700">Contact the academic office <ChevronRight aria-hidden="true" size={16} /></Link></div><Accordion items={academicFaqs} /></Container></section>
  </Layout>
);
