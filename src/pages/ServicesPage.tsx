import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Check, ChevronRight } from 'lucide-react';
import { SiteIcon, SiteLink, SiteText, useSitePage } from '@/site/SiteContent';

export const ServicesPage = () => {
  const page = useSitePage<any>('services');
  return (
    <Layout>
      <PageHero
        eyebrow={page.hero?.eyebrow}
        title={page.hero?.title}
        text={page.hero?.text}
        image={page.hero?.image}
        paths={{ eyebrow: 'services.hero.eyebrow', title: 'services.hero.title', text: 'services.hero.text' }}
      />
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <SiteText path="services.intro.eyebrow" value={page.intro?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="services.intro.title" value={page.intro?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            <SiteText path="services.intro.text" value={page.intro?.text} as="p" className="mt-3 text-muted" multiline />
          </div>
          <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {(page.items ?? []).map((service: any, index: number) => (
              <article key={service.id ?? index} className="bg-white p-7">
                <SiteIcon name={service.icon} size={28} className="text-brand-700" />
                <SiteText path={`services.items.${index}.title`} value={service.title} as="h3" className="mt-5 text-xl font-extrabold" />
                <SiteText path={`services.items.${index}.summary`} value={service.summary} as="p" className="mt-2 text-sm leading-relaxed text-muted" multiline />
                <ul className="mt-5 space-y-2">
                  {(service.features ?? []).map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex gap-2 text-sm text-ink">
                      <Check className="shrink-0 text-brand-500" size={16} aria-hidden="true" />
                      <SiteText path={`services.items.${index}.features.${featureIndex}`} value={feature} />
                    </li>
                  ))}
                </ul>
                <SiteLink path={`services.items.${index}.cta`} to={`/contact?topic=${service.slug ?? ''}`} label={service.ctaLabel ?? 'Enquire'} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
                  {service.ctaLabel ?? 'Enquire'} <ChevronRight aria-hidden="true" size={16} />
                </SiteLink>
              </article>
            ))}
          </div>
          {page.intro?.notice && <p className="mt-5 text-xs text-muted">{page.intro.notice}</p>}
        </Container>
      </section>
      <section className="bg-brand-50 py-14">
        <Container className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <SiteText path="services.enquiry.eyebrow" value={page.enquiry?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="services.enquiry.title" value={page.enquiry?.title} as="h2" className="mt-2 text-2xl font-extrabold" />
            <SiteText path="services.enquiry.text" value={page.enquiry?.text} as="p" className="mt-2 text-sm text-muted" multiline />
          </div>
          <SiteLink path="services.enquiry.cta" to={page.enquiry?.to ?? '/contact'} label={page.enquiry?.label ?? 'Make an enquiry'} className="inline-flex w-fit items-center gap-2 rounded bg-brand-500 px-5 py-3 font-bold text-white hover:bg-brand-700">
            {page.enquiry?.label ?? 'Make an enquiry'} <ChevronRight aria-hidden="true" size={16} />
          </SiteLink>
        </Container>
      </section>
    </Layout>
  );
};
