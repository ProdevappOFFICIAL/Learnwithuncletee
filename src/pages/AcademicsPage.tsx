import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Accordion } from '@/components/ui/Accordion';
import { Check, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { SiteIcon, SiteLink, SiteText, useSitePage } from '@/site/SiteContent';

export const AcademicsPage = () => {
  const page = useSitePage<any>('academics');
  return (
    <Layout>
      <PageHero
        eyebrow={page.hero?.eyebrow}
        title={page.hero?.title}
        text={page.hero?.text}
        image={page.hero?.image}
        paths={{ eyebrow: 'academics.hero.eyebrow', title: 'academics.hero.title', text: 'academics.hero.text' }}
      />
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <SiteText path="academics.programmesIntro.eyebrow" value={page.programmesIntro?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="academics.programmesIntro.title" value={page.programmesIntro?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            <SiteText path="academics.programmesIntro.text" value={page.programmesIntro?.text} as="p" className="mt-3 text-muted" multiline />
          </div>
          <div className="mt-10 grid gap-5">
            {(page.programmesIntro?.items ?? []).map((programme: any, index: number) => (
              <article key={programme.id ?? index} className="border border-line p-6">
                <SiteText path={`academics.programmesIntro.items.${index}.level`} value={programme.level} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
                <SiteText path={`academics.programmesIntro.items.${index}.title`} value={programme.title} as="h3" className="mt-3 text-xl font-extrabold" />
                <SiteText path={`academics.programmesIntro.items.${index}.description`} value={programme.description} as="p" className="mt-3 text-sm leading-relaxed text-muted" multiline />
                <ul className="mt-5 space-y-2">
                  {(programme.outcomes ?? []).map((outcome: string, outcomeIndex: number) => (
                    <li key={outcomeIndex} className="flex gap-2 text-sm text-ink">
                      <Check className="shrink-0 text-brand-500" size={16} aria-hidden="true" />
                      <SiteText path={`academics.programmesIntro.items.${index}.outcomes.${outcomeIndex}`} value={outcome} />
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          {page.programmesIntro?.notice && <p className="mt-5 text-xs text-muted">{page.programmesIntro.notice}</p>}
        </Container>
      </section>
      <section className="bg-brand-50 py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <SiteText path="academics.curriculum.eyebrow" value={page.curriculum?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="academics.curriculum.title" value={page.curriculum?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            <SiteText path="academics.curriculum.text" value={page.curriculum?.text} as="p" className="mt-4 leading-relaxed text-muted" multiline />
            {page.curriculum?.notice && <p className="mt-5 text-xs text-muted">{page.curriculum.notice}</p>}
          </div>
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {(page.curriculum?.approaches ?? []).map((item: string, index: number) => (
              <div key={index} className="bg-white p-5">
                <SiteIcon name="lightbulb" size={18} className="text-brand-600" />
                <SiteText path={`academics.curriculum.approaches.${index}`} value={item} as="h3" className="mt-3 font-bold" />
                <p className="mt-2 text-sm text-muted">Learning experiences that help students apply ideas and build confidence.</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <SiteText path="academics.subjects.eyebrow" value={page.subjects?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
              <SiteText path="academics.subjects.title" value={page.subjects?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
              <SiteText path="academics.subjects.text" value={page.subjects?.text} as="p" className="mt-4 text-muted" multiline />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(page.subjects?.groups ?? []).map((group: any, index: number) => (
                <article key={index} className="border-t border-line pt-4">
                  <SiteText path={`academics.subjects.groups.${index}.name`} value={group.name} as="h3" className="font-bold" />
                  <p className="mt-2 text-sm text-muted">{(group.subjects ?? []).join(' · ')}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-10 border-y border-line py-7">
            <SiteText path="academics.subjects.resourceTitle" value={page.subjects?.resourceTitle} as="h3" className="text-lg font-bold" />
            <SiteText path="academics.subjects.resourceText" value={page.subjects?.resourceText} as="p" className="mt-2 text-sm text-muted" multiline />
          </div>
        </Container>
      </section>
      <section className="bg-cream py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <SiteText path="academics.faqs.eyebrow" value={page.faqs?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="academics.faqs.title" value={page.faqs?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            <SiteText path="academics.faqs.text" value={page.faqs?.text} as="p" className="mt-3 text-sm text-muted" multiline />
            <SiteLink path="academics.faqs.cta" to={page.faqs?.ctaTo ?? ROUTES.contact} label={page.faqs?.ctaLabel ?? 'Contact the academic office'} className="mt-5 inline-flex items-center gap-2 font-bold text-brand-700">
              {page.faqs?.ctaLabel ?? 'Contact the academic office'} <ChevronRight aria-hidden="true" size={16} />
            </SiteLink>
          </div>
          <Accordion items={(page.faqs?.items ?? []).map((item: any) => ({ id: item.id, question: item.question, answer: item.answer }))} />
        </Container>
      </section>
    </Layout>
  );
};
