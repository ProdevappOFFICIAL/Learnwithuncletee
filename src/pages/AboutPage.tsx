import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { SampleNotice } from '@/components/ui/SampleNotice';
import { ROUTES } from '@/routes/paths';
import { ChevronRight } from 'lucide-react';
import { SiteIcon, SiteImage, SiteLink, SiteText, useSiteLeadership, useSitePage } from '@/site/SiteContent';

export const AboutPage = () => {
  const about = useSitePage<any>('about');
  const principals = useSiteLeadership();
  const leadership = about.leadership ?? {};
  const otherLeaders = leadership.others ?? [];
  const principalMessages = String(leadership.principalMessage ?? '');
  const principalCards = principals.length
    ? principals.slice(0, 1).map((principal: any) => ({
        id: principal.id,
        name: principal.name,
        role: principal.role,
        img: principal.photoUrl,
      }))
    : [{
        id: 'principal',
        name: 'The Principal',
        role: 'Principal',
        img: '/teachers/akintems.jpeg',
      }];

  return (
    <Layout>
      <PageHero
        eyebrow={about.hero?.eyebrow}
        title={about.hero?.title}
        text={about.hero?.text}
        image={about.hero?.image}
        paths={{ eyebrow: 'about.hero.eyebrow', title: 'about.hero.title', text: 'about.hero.text' }}
      />
      <section className="py-16 sm:py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SiteText path="about.story.eyebrow" value={about.story?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="about.story.title" value={about.story?.title} as="h2" className="mt-3 text-3xl font-extrabold text-ink" />
            {(about.story?.paragraphs ?? []).map((paragraph: string, index: number) => (
              <SiteText key={index} path={`about.story.paragraphs.${index}`} value={paragraph} as="p" className="mt-5 leading-relaxed text-muted" multiline />
            ))}
            {about.story?.notice && (
              <div className="mt-6">
                <SampleNotice>{about.story.notice}</SampleNotice>
              </div>
            )}
          </div>
          <SiteImage path="about.story.image" src={about.story?.image} alt="Students learning in a classroom" className="aspect-[4/3] w-full rounded-3xl object-cover" />
        </Container>
      </section>
      <section className="bg-brand-900 py-16 text-white sm:py-20">
        <Container className="grid gap-12 md:grid-cols-2">
          {(about.missionVision ?? []).map((item: any, index: number) => (
            <article key={index} className="border-t border-lime-accent/60 pt-5">
              <SiteText path={`about.missionVision.${index}.title`} value={item.title} as="p" className="text-xs font-bold uppercase tracking-widest text-lime-accent" />
              <SiteText path={`about.missionVision.${index}.text`} value={item.text} as="p" className="mt-4 max-w-xl text-2xl font-bold leading-snug" multiline />
            </article>
          ))}
        </Container>
      </section>
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <SiteText path="about.values.eyebrow" value={about.values?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="about.values.title" value={about.values?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
          </div>
          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {(about.values?.items ?? []).map((value: any, index: number) => (
              <div key={value.id ?? index} className="border border-line px-3 py-5 text-center">
                <SiteIcon name={value.icon} size={24} className="mx-auto text-brand-700" />
                <SiteText path={`about.values.items.${index}.title`} value={value.title} as="h3" className="mt-3 text-sm font-bold" />
              </div>
            ))}
          </div>
          {about.values?.notice && <div className="mt-5"><SampleNotice>{about.values.notice}</SampleNotice></div>}
        </Container>
      </section>
      <section className="bg-cream py-16 sm:py-20">
        <Container>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <SiteText path="about.leadership.eyebrow" value={leadership.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
              <SiteText path="about.leadership.title" value={leadership.title} as="h2" className="mt-3 text-3xl font-extrabold" />
              <SiteText path="about.leadership.text" value={leadership.text} as="p" className="mt-3 text-muted" multiline />
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {principalCards.map((member: any) => (
              <article key={member.id} className="border border-line bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                    <img src={member.img || '/logo.png'} alt="" className="h-14 w-14 rounded-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold">{member.name}</h3>
                    <p className="text-sm text-brand-700">{member.role}</p>
                  </div>
                </div>
                <SiteText path="about.leadership.principalMessage" value={principalMessages || 'We are committed to nurturing every child academically, socially and morally to become confident future leaders.'} as="p" className="mt-5 leading-relaxed text-muted" multiline />
              </article>
            ))}
            {otherLeaders.map((member: any, index: number) => (
              <article key={member.id ?? index} className="border border-line bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                    <SiteImage path={`about.leadership.others.${index}.img`} src={member.img} alt={member.name ?? ''} className="h-14 w-14 rounded-full object-cover" />
                  </div>
                  <div>
                    <SiteText path={`about.leadership.others.${index}.name`} value={member.name} as="h3" className="font-bold" />
                    <SiteText path={`about.leadership.others.${index}.role`} value={member.role} as="p" className="text-sm text-brand-700" />
                  </div>
                </div>
                <SiteText path={`about.leadership.others.${index}.message`} value={member.message} as="p" className="mt-5 leading-relaxed text-muted" multiline />
              </article>
            ))}
          </div>
        </Container>
      </section>
      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <SiteText path="about.whyChooseUs.eyebrow" value={about.whyChooseUs?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
              <SiteText path="about.whyChooseUs.title" value={about.whyChooseUs?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {(about.whyChooseUs?.items ?? []).map((item: any, index: number) => (
                <article key={item.id ?? index} className="border-t border-line pt-4">
                  <SiteText path={`about.whyChooseUs.items.${index}.title`} value={item.title} as="h3" className="font-bold" />
                  <SiteText path={`about.whyChooseUs.items.${index}.text`} value={item.text} as="p" className="mt-2 text-sm leading-relaxed text-muted" multiline />
                </article>
              ))}
            </div>
          </div>
          <SiteLink path="about.cta" to={about.ctaTo ?? ROUTES.admissions} label={about.ctaLabel ?? 'Become part of our story'} className="mt-8 inline-flex items-center gap-2 rounded bg-brand-500 px-5 py-3 font-bold text-white hover:bg-brand-700">
            {about.ctaLabel ?? 'Become part of our story'} <ChevronRight aria-hidden="true" size={16} />
          </SiteLink>
        </Container>
      </section>
    </Layout>
  );
};
