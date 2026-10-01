import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Accordion } from '@/components/ui/Accordion';
import { SampleNotice } from '@/components/ui/SampleNotice';
import { admissionsFaqs } from '@/data/faqs';
import { programmes } from '@/data/programmes';
import { ROUTES } from '@/routes/paths';

const steps = ['Submit an enquiry', 'Document review', 'Assessment or interview', 'Offer and acceptance', 'Enrollment'];
const documents = ['Birth certificate', 'Recent passport photograph', 'Previous school report', 'Transfer documents, if applicable', 'Medical information'];

export const AdmissionsPage = () => {
  const [enquiryStarted, setEnquiryStarted] = useState(false);

  return (
    <Layout>
      <PageHero eyebrow="Admissions" title="A great next step starts here" text="Explore our programmes and speak with the school about joining the Learnwithuncletee community." image="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1800&q=85" />
      <section className="py-16 sm:py-20"><Container className="grid gap-10 lg:grid-cols-[1.2fr_.8fr]"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Who can apply</p><h2 className="mt-3 text-3xl font-extrabold">Find the right learning pathway</h2><p className="mt-3 max-w-2xl text-muted">Applications are welcomed for our early years, primary and secondary programmes. Placement depends on age, previous learning and available spaces.</p><div className="mt-7 grid gap-3 sm:grid-cols-3">{programmes.map((programme) => <div key={programme.id} className="border border-line p-4"><p className="text-xs font-bold text-brand-700">{programme.level}</p><p className="mt-2 font-bold">{programme.title}</p><p className="mt-1 text-xs text-muted">{programme.ageRange}</p></div>)}</div><div className="mt-5"><SampleNotice>Admissions availability and age requirements need confirmation for each session.</SampleNotice></div></div><aside className="bg-brand-900 p-7 text-white"><p className="text-xs font-bold uppercase tracking-widest text-lime-accent">Take the first step</p><h2 className="mt-3 text-2xl font-extrabold">Talk to admissions</h2><p className="mt-3 text-sm leading-relaxed text-white/75">Our admissions team can advise on requirements, availability and next steps.</p><Link to={ROUTES.contact} className="mt-6 inline-flex rounded bg-lime-accent px-5 py-3 text-sm font-bold text-brand-900">Contact Admissions →</Link><button type="button" onClick={() => setEnquiryStarted(true)} className="mt-3 block text-sm font-semibold text-white underline underline-offset-4">Start an application enquiry</button>{enquiryStarted && <p className="mt-4 border-t border-white/20 pt-4 text-xs text-white/75">Online applications are not connected yet. Contact the school office to begin.</p>}</aside></Container></section>
      <section className="bg-cream py-16 sm:py-20"><Container><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-widest text-brand-700">The process</p><h2 className="mt-3 text-3xl font-extrabold">Your admissions journey</h2></div><ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{steps.map((step, index) => <li key={step} className="border-t-2 border-brand-400 bg-white p-5"><span className="text-2xl font-extrabold text-brand-500">0{index + 1}</span><h3 className="mt-3 font-bold">{step}</h3></li>)}</ol></Container></section>
      <section className="py-16 sm:py-20"><Container className="grid gap-12 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">What to prepare</p><h2 className="mt-3 text-3xl font-extrabold">Entry documents</h2><ul className="mt-6 space-y-3">{documents.map((document) => <li key={document} className="flex gap-3 border-b border-line pb-3 text-sm"><span className="font-bold text-brand-600">✓</span>{document}</li>)}</ul><div className="mt-5"><SampleNotice>Document requirements may vary by level. Confirm the official list before applying.</SampleNotice></div></div><div className="bg-brand-50 p-7"><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Fees & important dates</p><h2 className="mt-3 text-2xl font-extrabold">Get current information</h2><p className="mt-3 text-sm leading-relaxed text-muted">Fees, application deadlines, assessment dates and resumption information change by session. We do not publish fee amounts or dates here until they are confirmed.</p><Link to={ROUTES.contact} className="mt-5 inline-flex rounded border border-brand-500 px-4 py-3 text-sm font-bold text-brand-700">Request current details →</Link></div></Container></section>
      <section className="bg-cream py-16 sm:py-20"><Container className="grid gap-10 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Need a hand?</p><h2 className="mt-3 text-3xl font-extrabold">Admissions FAQs</h2><p className="mt-3 text-sm text-muted">Our team can guide you through the process and help with any questions.</p></div><Accordion items={admissionsFaqs} /></Container></section>
    </Layout>
  );
};
