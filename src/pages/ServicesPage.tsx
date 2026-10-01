import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { SampleNotice } from '@/components/ui/SampleNotice';
import { services } from '@/data/services';
import { ROUTES } from '@/routes/paths';
import { ChevronRight } from 'lucide-react';

export const ServicesPage = () => (
  <Layout>
    <PageHero eyebrow="School services" title="More than just education" text="Explore school-supported services for students, families and the wider community." image="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1800&q=85" />
    <section className="py-16 sm:py-20"><Container><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Support & opportunities</p><h2 className="mt-3 text-3xl font-extrabold">Services for the school community</h2><p className="mt-3 text-muted">Contact the school to confirm availability, schedules, eligibility and costs.</p></div><div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">{services.map((service) => <article key={service.id} className="bg-white p-7"><span className="text-3xl" aria-hidden="true">{service.icon}</span><h3 className="mt-5 text-xl font-extrabold">{service.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{service.summary}</p><ul className="mt-5 space-y-2">{service.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-ink"><span className="text-brand-500">✓</span>{feature}</li>)}</ul><Link to={`${ROUTES.contact}?topic=${service.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-700">{service.ctaLabel}<ChevronRight aria-hidden="true" size={16} /></Link></article>)}</div><div className="mt-5"><SampleNotice>Services and features shown are sample placeholders. Confirm which are officially offered before publication.</SampleNotice></div></Container></section>
    <section className="bg-brand-50 py-14"><Container className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Have a question?</p><h2 className="mt-2 text-2xl font-extrabold">Talk to our school team</h2><p className="mt-2 text-sm text-muted">Send an enquiry and the appropriate department can follow up.</p></div><Link to={ROUTES.contact} className="inline-flex w-fit items-center gap-2 rounded bg-brand-500 px-5 py-3 font-bold text-white hover:bg-brand-700">Make an enquiry <ChevronRight aria-hidden="true" size={16} /></Link></Container></section>
  </Layout>
);
