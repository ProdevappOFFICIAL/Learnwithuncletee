import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Accordion } from '@/components/ui/Accordion';
import { Check, ChevronRight } from 'lucide-react';
import { SiteLink, SiteText, useSitePage } from '@/site/SiteContent';

export const AdmissionsPage = () => {
  const page = useSitePage<any>('admissions');
  const [enquiryStarted, setEnquiryStarted] = useState(false);
  return (
    <Layout>
      <PageHero
        eyebrow={page.hero?.eyebrow}
        title={page.hero?.title}
        text={page.hero?.text}
        image={page.hero?.image}
        paths={{ eyebrow: 'admissions.hero.eyebrow', title: 'admissions.hero.title', text: 'admissions.hero.text' }}
      />
      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <SiteText path="admissions.intro.eyebrow" value={page.intro?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="admissions.intro.title" value={page.intro?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            <SiteText path="admissions.intro.text" value={page.intro?.text} as="p" className="mt-3 max-w-2xl text-muted" multiline />
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {(page.programmes ?? []).map((programme: any, index: number) => (
                <div key={programme.id ?? index} className="border border-line p-4">
                  <SiteText path={`admissions.programmes.${index}.level`} value={programme.level} as="p" className="text-xs font-bold text-brand-700" />
                  <SiteText path={`admissions.programmes.${index}.title`} value={programme.title} as="p" className="mt-2 font-bold" />
                  <SiteText path={`admissions.programmes.${index}.ageRange`} value={programme.ageRange} as="p" className="mt-1 text-xs text-muted" />
                </div>
              ))}
            </div>
            {page.intro?.notice && <p className="mt-5 text-xs text-muted">{page.intro.notice}</p>}
          </div>
          <aside className="bg-brand-900 p-7 text-white">
            <SiteText path="admissions.aside.eyebrow" value={page.aside?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-lime-accent" />
            <SiteText path="admissions.aside.title" value={page.aside?.title} as="h2" className="mt-3 text-2xl font-extrabold" />
            <SiteText path="admissions.aside.text" value={page.aside?.text} as="p" className="mt-3 text-sm leading-relaxed text-white/75" multiline />
            <SiteLink path="admissions.aside.cta" to={page.aside?.ctaTo ?? '/contact'} label={page.aside?.ctaLabel ?? 'Contact Admissions'} className="mt-6 inline-flex items-center gap-2 rounded bg-lime-accent px-5 py-3 text-sm font-bold text-brand-900">
              {page.aside?.ctaLabel ?? 'Contact Admissions'} <ChevronRight aria-hidden="true" size={16} />
            </SiteLink>
            <button type="button" onClick={() => setEnquiryStarted(true)} className="mt-3 block text-sm font-semibold text-white underline underline-offset-4">
              {page.aside?.enquiryLabel ?? 'Start an application enquiry'}
            </button>
            {enquiryStarted && <p className="mt-4 border-t border-white/20 pt-4 text-xs text-white/75">{page.aside?.enquiryNote}</p>}
          </aside>
        </Container>
      </section>
      <section className="bg-cream py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <SiteText path="admissions.steps.eyebrow" value={page.steps?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="admissions.steps.title" value={page.steps?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {(page.steps?.items ?? []).map((step: string, index: number) => (
              <li key={index} className="border-t-2 border-brand-400 bg-white p-5">
                <span className="text-2xl font-extrabold text-brand-500">0{index + 1}</span>
                <SiteText path={`admissions.steps.items.${index}`} value={step} as="h3" className="mt-3 font-bold" />
              </li>
            ))}
          </ol>
        </Container>
      </section>
      <section className="py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SiteText path="admissions.documents.eyebrow" value={page.documents?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="admissions.documents.title" value={page.documents?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            <ul className="mt-6 space-y-3">
              {(page.documents?.items ?? []).map((document: string, index: number) => (
                <li key={index} className="flex gap-3 border-b border-line pb-3 text-sm">
                  <Check className="shrink-0 text-brand-600" size={16} aria-hidden="true" />
                  <SiteText path={`admissions.documents.items.${index}`} value={document} />
                </li>
              ))}
            </ul>
            {page.documents?.notice && <p className="mt-5 text-xs text-muted">{page.documents.notice}</p>}
          </div>
          <div className="bg-brand-50 p-7">
            <SiteText path="admissions.fees.eyebrow" value={page.fees?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="admissions.fees.title" value={page.fees?.title} as="h2" className="mt-3 text-2xl font-extrabold" />
            <SiteText path="admissions.fees.text" value={page.fees?.text} as="p" className="mt-3 text-sm leading-relaxed text-muted" multiline />
            <SiteLink path="admissions.fees.cta" to={page.fees?.ctaTo ?? '/contact'} label={page.fees?.ctaLabel ?? 'Request current details'} className="mt-5 inline-flex items-center gap-2 rounded border border-brand-500 px-4 py-3 text-sm font-bold text-brand-700">
              {page.fees?.ctaLabel ?? 'Request current details'} <ChevronRight aria-hidden="true" size={16} />
            </SiteLink>
          </div>
        </Container>
      </section>
      <section className="bg-cream py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <SiteText path="admissions.faqs.eyebrow" value={page.faqs?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="admissions.faqs.title" value={page.faqs?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            <SiteText path="admissions.faqs.text" value={page.faqs?.text} as="p" className="mt-3 text-sm text-muted" multiline />
          </div>
          <Accordion items={(page.faqs?.items ?? []).map((item: any) => ({ id: item.id, question: item.question, answer: item.answer }))} />
        </Container>
      </section>
    </Layout>
  );
};
