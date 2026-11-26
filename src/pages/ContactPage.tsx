import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { SampleNotice } from '@/components/ui/SampleNotice';
import { siteInfo } from '@/data/content';

const fieldClass = 'mt-2 min-h-12 w-full rounded border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export const ContactPage = () => {
  const [searchParams] = useSearchParams();
  const [sent, setSent] = useState(false);
  const initialTopic = searchParams.get('topic') ?? '';

  return (
    <Layout>
      <PageHero eyebrow="Contact" title="We’d love to hear from you" text="Reach out with questions about admissions, academics, school services or the portal." image="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1800&q=85" />
      <section className="py-16 sm:py-20"><Container className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
        <aside><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Get in touch</p><h2 className="mt-3 text-3xl font-extrabold">Contact details</h2><p className="mt-3 text-sm leading-relaxed text-muted">Call the Central Admin or School Secretary using the official numbers below.</p><div className="mt-7 space-y-5 border-t border-line pt-5 text-sm"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Address</p><p className="mt-1 text-muted">{siteInfo.address}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Phone</p><ul className="mt-1 space-y-2">{siteInfo.phoneContacts.map((contact) => <li key={contact.label}><span className="text-muted">{contact.label}: </span><a href={contact.href} className="font-semibold text-brand-700 hover:underline">{contact.number}</a></li>)}</ul></div><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Email</p><p className="mt-1 text-muted">{siteInfo.email}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Opening hours</p><p className="mt-1 text-muted">{siteInfo.hours}</p></div></div><div className="mt-7"><SampleNotice>Address, email, opening hours and map location are pending confirmation.</SampleNotice></div></aside>
        <div className="border border-line p-6 sm:p-8"><h2 className="text-2xl font-extrabold">Send an enquiry</h2><p className="mt-2 text-sm text-muted">Choose a topic and share how we can help.</p><form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
          <label className="text-sm font-semibold">Full name<input className={fieldClass} name="name" autoComplete="name" required /></label>
          <label className="text-sm font-semibold">Email address<input className={fieldClass} name="email" type="email" autoComplete="email" required /></label>
          <label className="text-sm font-semibold">Phone<input className={fieldClass} name="phone" type="tel" autoComplete="tel" /></label>
          <label className="text-sm font-semibold">Topic<select className={fieldClass} name="topic" defaultValue={initialTopic}><option value="">Select a topic</option><option value="admissions">Admissions</option><option value="catering">Catering</option><option value="coaching">Coaching</option><option value="accommodation">Accommodation</option><option value="portal">Portal support</option><option value="general">General enquiry</option><option value="other">Other</option></select></label>
          <label className="text-sm font-semibold sm:col-span-2">Message<textarea className={`${fieldClass} min-h-32 py-3`} name="message" required /></label>
          <div className="sm:col-span-2"><button type="submit" className="min-h-12 rounded bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700">Send enquiry</button>{sent && <p role="status" className="mt-3 text-sm font-semibold text-brand-700">Demo only: this form is not connected to a message service, so nothing was sent.</p>}<p className="mt-4 text-xs text-muted">Form preview only. A secure delivery service must be connected before launch.</p></div>
        </form></div>
      </Container></section>
    </Layout>
  );
};
