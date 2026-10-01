import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { SampleNotice } from '@/components/ui/SampleNotice';
import { coreValues, keyStats, whyChooseUs } from '@/data/content';
import { leadership } from '@/data/staff';
import { ROUTES } from '@/routes/paths';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const AboutPage = () => (
  <Layout>
    <PageHero eyebrow="Our school" title="About Learnwithuncletee" text="A welcoming school community committed to learning, growth and character." image="/school.JPG" />
    <section className="py-16 sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Our story</p><h2 className="mt-3 text-3xl font-extrabold text-ink">A foundation for the future</h2><p className="mt-5 leading-relaxed text-muted">Learnwithuncletee is a school community focused on helping children develop the knowledge, confidence and character they need for life. We partner with families to make each learner feel known, supported and encouraged.</p><p className="mt-4 leading-relaxed text-muted">Our history and milestones belong here once confirmed by school leadership. We are building an environment where academic progress and personal growth go hand in hand.</p><div className="mt-6"><SampleNotice>School founding year, history and milestones are placeholders pending confirmation.</SampleNotice></div></div>
        <img src="/img_1.jpeg" alt="Students learning in a classroom, sample image" loading="lazy" className="aspect-[4/3] w-full object-cover rounded-3xl" />
      </Container>
    </section>
    <section className="bg-brand-900 py-16 text-white sm:py-20">
      <Container className="grid gap-12 md:grid-cols-2">
        {[{ title: 'Our Mission', text: 'To provide a supportive learning environment that nurtures academic excellence, strong character and confidence in every learner.' }, { title: 'Our Vision', text: 'To empower young people to become thoughtful, capable and compassionate contributors to their communities.' }].map((item) => <article key={item.title} className="border-t border-lime-accent/60 pt-5"><p className="text-xs font-bold uppercase tracking-widest text-lime-accent">{item.title}</p><p className="mt-4 max-w-xl text-2xl font-bold leading-snug">{item.text}</p></article>)}
      </Container>
    </section>
    <section className="py-16 sm:py-20">
      <Container><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-widest text-brand-700">What guides us</p><h2 className="mt-3 text-3xl font-extrabold">Our core values</h2></div><div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{coreValues.map((value) => <div key={value.id} className="border border-line px-3 py-5 text-center"><value.icon className="mx-auto text-brand-700" size={24} aria-hidden="true" /><h3 className="mt-3 text-sm font-bold">{value.title}</h3></div>)}</div><div className="mt-5"><SampleNotice>Values shown are proposed placeholders; confirm the school's official values.</SampleNotice></div></Container>
    </section>
    <section className="bg-cream py-16 sm:py-20">
      <Container><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Leadership</p><h2 className="mt-3 text-3xl font-extrabold">Guided by a shared purpose</h2><p className="mt-3 text-muted">Meet the people helping shape our school community.</p></div><SampleNotice>Names, portraits and biographies await official confirmation.</SampleNotice></div><div className="mt-8 grid gap-5 md:grid-cols-2">{leadership.map((member) => <article key={member.id} className="border border-line bg-white p-6"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">{member.name.slice(0, 1)}</div><div><h3 className="font-bold">{member.name}</h3><p className="text-sm text-brand-700">{member.role}</p></div></div><p className="mt-5 leading-relaxed text-muted">“{member.message}”</p></article>)}</div></Container>
    </section>
    <section className="py-16 sm:py-20"><Container><div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">The Learnwithuncletee experience</p><h2 className="mt-3 text-3xl font-extrabold">Why families choose us</h2></div><div className="grid gap-5 sm:grid-cols-2">{whyChooseUs.map((item) => <article key={item.id} className="border-t border-line pt-4"><h3 className="font-bold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p></article>)}</div></div><div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-line pt-7"><p className="text-sm text-muted">Figures are sample placeholders pending school verification.</p><div className="flex gap-3">{keyStats.slice(0, 3).map((stat) => <div key={stat.id}><strong className="block text-xl text-brand-700">{stat.value}</strong><span className="text-xs text-muted">{stat.label}</span></div>)}</div></div><Link to={ROUTES.admissions} className="mt-8 inline-flex items-center gap-2 rounded bg-brand-500 px-5 py-3 font-bold text-white hover:bg-brand-700">Become part of our story <ChevronRight aria-hidden="true" size={16} /></Link></Container></section>
  </Layout>
);
