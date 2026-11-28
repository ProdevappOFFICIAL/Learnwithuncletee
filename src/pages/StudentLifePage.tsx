import { Container } from '@/components/ui/Container';
import { Layout } from '@/components/layout/Layout';
import { PageHero } from '@/components/ui/PageHero';
import { ChevronRight } from 'lucide-react';
import { SiteImage, SiteLink, SiteText, useSitePage } from '@/site/SiteContent';
import { ROUTES } from '@/routes/paths';

export const StudentLifePage = () => {
  const page = useSitePage<any>('student-life');
  return (
    <Layout>
      <PageHero
        eyebrow={page.hero?.eyebrow}
        title={page.hero?.title}
        text={page.hero?.text}
        image={page.hero?.image}
        paths={{ eyebrow: 'student-life.hero.eyebrow', title: 'student-life.hero.title', text: 'student-life.hero.text' }}
      />
      <section className="py-16 sm:py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SiteText path="student-life.intro.eyebrow" value={page.intro?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="student-life.intro.title" value={page.intro?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            <SiteText path="student-life.intro.text" value={page.intro?.text} as="p" className="mt-4 leading-relaxed text-muted" multiline />
            {page.intro?.notice && <p className="mt-5 text-xs text-muted">{page.intro.notice}</p>}
          </div>
          <SiteImage path="student-life.intro.image" src={page.intro?.image} alt="Students in a classroom" className="aspect-[4/3] w-full object-cover" />
        </Container>
      </section>
      <section className="bg-cream py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <SiteText path="student-life.experiences.eyebrow" value={page.experiences?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="student-life.experiences.title" value={page.experiences?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            <SiteText path="student-life.experiences.text" value={page.experiences?.text} as="p" className="mt-3 text-muted" multiline />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {(page.experiences?.items ?? []).map((item: any, index: number) => (
              <article key={index} className="border border-line bg-white">
                <SiteImage path={`student-life.experiences.items.${index}.image`} src={item.image} alt={item.title} className="aspect-[16/10] w-full object-cover" />
                <div className="p-6">
                  <SiteText path={`student-life.experiences.items.${index}.title`} value={item.title} as="h3" className="text-xl font-extrabold" />
                  <SiteText path={`student-life.experiences.items.${index}.text`} value={item.text} as="p" className="mt-2 text-sm leading-relaxed text-muted" multiline />
                </div>
              </article>
            ))}
          </div>
          {page.experiences?.notice && <p className="mt-5 text-xs text-muted">{page.experiences.notice}</p>}
        </Container>
      </section>
      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 md:grid-cols-2">
          {(page.support ?? []).map((item: any, index: number) => (
            <article key={index} className="border-t-2 border-brand-400 pt-5">
              <SiteText path={`student-life.support.${index}.eyebrow`} value={item.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
              <SiteText path={`student-life.support.${index}.title`} value={item.title} as="h2" className="mt-3 text-2xl font-extrabold" />
              <SiteText path={`student-life.support.${index}.text`} value={item.text} as="p" className="mt-3 text-sm leading-relaxed text-muted" multiline />
              <SiteLink path={`student-life.support.${index}.cta`} to={item.ctaTo ?? ROUTES.contact} label={item.ctaLabel ?? 'Learn more'} className="mt-5 inline-flex items-center gap-1 font-bold text-brand-700">
                {item.ctaLabel ?? 'Learn more'} <ChevronRight aria-hidden="true" size={16} />
              </SiteLink>
            </article>
          ))}
        </Container>
      </section>
      <section className="bg-brand-900 py-14 text-white">
        <Container className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <SiteText path="student-life.galleryCta.eyebrow" value={page.galleryCta?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-lime-accent" />
            <SiteText path="student-life.galleryCta.title" value={page.galleryCta?.title} as="h2" className="mt-2 text-2xl font-extrabold" />
          </div>
          <SiteLink path="student-life.galleryCta.link" to={page.galleryCta?.to ?? ROUTES.gallery} label={page.galleryCta?.label ?? 'Visit the gallery'} className="inline-flex w-fit items-center gap-2 rounded bg-lime-accent px-5 py-3 font-bold text-brand-900">
            {page.galleryCta?.label ?? 'Visit the gallery'} <ChevronRight aria-hidden="true" size={16} />
          </SiteLink>
        </Container>
      </section>
    </Layout>
  );
};
